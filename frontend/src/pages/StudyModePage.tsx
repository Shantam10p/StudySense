import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { completeStudyTask, deleteChatHistory, fetchChatHistory, fetchSenseiContent, saveChatMessage, sendSenseiMessage } from "../api";
import senseiLogo from "../assets/sensei_face.png";
import type { PlannerStudyTask } from "../types/planner";
import type { SenseiChatMessage, SenseiConceptItem, SenseiContentResponse, SenseiPracticeQuestion } from "../types/sensei";

type StudyModeLocationState = {
  courseId: number;
  courseName: string;
  task: PlannerStudyTask;
  dayIndex: number;
  senseiContent?: SenseiContentResponse;
};

const TABS = ["Notes", "Practice Questions", "Chat"] as const;
type Tab = (typeof TABS)[number];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function deriveTopicFromTitle(title: string) {
  return title
    .replace(/^(Study|Continue|Revisit|Review)\s+/i, "")
    .replace(/\s+using\s+.+$/i, "")
    .trim();
}

export default function StudyModePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as StudyModeLocationState | null;

  const session = state?.task;
  const timerStorageKey = state?.courseId && session?.id
    ? `study_timer:${state.courseId}:${state.dayIndex}:${session.id}`
    : null;
  const topic = useMemo(() => deriveTopicFromTitle(session?.title ?? "this topic"), [session?.title]);

  const userName = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("auth_user") || "{}");
      return u.name?.split(" ")[0] || "there";
    } catch { return "there"; }
  }, []);

  // timer state
  const [activeTab, setActiveTab] = useState<Tab>("Notes");
  const [isRunning, setIsRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(session ? session.duration_minutes * 60 : 0);
  const [timerReady, setTimerReady] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // sensei content state
  const [concepts, setConcepts] = useState<SenseiConceptItem[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<SenseiPracticeQuestion[]>([]);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  // chat state
  const [chatHistory, setChatHistory] = useState<SenseiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // redirect if no session
  useEffect(() => {
    if (!session) navigate("/dashboard", { replace: true });
  }, [navigate, session]);

  // load timer from localStorage
  useEffect(() => {
    if (!session) {
      setTimeLeft(0);
      setIsRunning(true);
      setTimerReady(true);
      return;
    }

    const defaultTimeLeft = session.duration_minutes * 60;

    if (!timerStorageKey) {
      setTimeLeft(defaultTimeLeft);
      setIsRunning(true);
      setTimerReady(true);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(timerStorageKey);
      if (!storedValue) {
        setTimeLeft(defaultTimeLeft);
        setIsRunning(true);
      } else {
        const parsed = JSON.parse(storedValue) as { timeLeft?: number; isRunning?: boolean };
        setTimeLeft(typeof parsed.timeLeft === "number" ? parsed.timeLeft : defaultTimeLeft);
        setIsRunning(typeof parsed.isRunning === "boolean" ? parsed.isRunning : true);
      }
    } catch {
      setTimeLeft(defaultTimeLeft);
      setIsRunning(true);
    }

    setTimerReady(true);
  }, [session, timerStorageKey]);

  // persist timer to localStorage
  useEffect(() => {
    if (!session || !timerStorageKey || !timerReady) return;
    window.localStorage.setItem(timerStorageKey, JSON.stringify({ timeLeft, isRunning }));
  }, [isRunning, session, timeLeft, timerReady, timerStorageKey]);

  // countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) { window.clearInterval(timer); return 0; }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, timeLeft]);

  // use pre-fetched content from dashboard if available, otherwise fetch
  useEffect(() => {
    if (!session || !state) return;

    const welcome: SenseiChatMessage = {
      role: "assistant",
      content: `Hi ${userName}! I'm your Sensei. Ask me anything about ${topic} and I'll help you understand it.`,
    };

    let cancelled = false;
    setContentLoading(true);
    setContentError(null);

    const contentPromise = state.senseiContent
      ? Promise.resolve(state.senseiContent)
      : fetchSenseiContent({ topic, course_name: state.courseName, course_id: state.courseId });

    Promise.all([contentPromise, fetchChatHistory(session.id)])
      .then(([contentData, historyData]) => {
        if (cancelled) return;
        setConcepts(contentData.concepts);
        setPracticeQuestions(contentData.practice_questions);
        // if history exists load it, otherwise start fresh with welcome
        if (historyData.messages.length > 0) {
          setChatHistory(historyData.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
        } else {
          setChatHistory([welcome]);
          saveChatMessage({ task_id: session.id, role: "assistant", content: welcome.content });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setContentError("Sensei couldn't load content right now. Try refreshing.");
      })
      .finally(() => {
        if (cancelled) return;
        setContentLoading(false);
      });

    return () => { cancelled = true; };
  }, [session?.id]);

  // scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatSending]);

  const handleCompleteSession = async () => {
    if (!session || isCompleting) return;
    setIsCompleting(true);
    setCompletionError(null);
    try {
      await completeStudyTask(session.id);
      if (timerStorageKey) window.localStorage.removeItem(timerStorageKey);
      navigate("/dashboard");
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "Failed to complete session");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatSending || !state || !session) return;

    const userMessage: SenseiChatMessage = { role: "user", content: trimmed };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setChatInput("");
    setChatSending(true);
    setChatError(null);

    saveChatMessage({ task_id: session.id, role: "user", content: trimmed });

    try {
      const response = await sendSenseiMessage({
        topic,
        course_name: state.courseName,
        history: chatHistory,
        message: trimmed,
      });
      const assistantMessage: SenseiChatMessage = { role: "assistant", content: response.reply };
      setChatHistory([...updatedHistory, assistantMessage]);
      saveChatMessage({ task_id: session.id, role: "assistant", content: response.reply });
    } catch {
      setChatError("Sensei couldn't respond. Please try again.");
      setChatHistory(chatHistory);
    } finally {
      setChatSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!session) return;
    const welcome: SenseiChatMessage = {
      role: "assistant",
      content: `Hi ${userName}! I'm your Sensei. Ask me anything about ${topic} and I'll help you understand it.`,
    };
    await deleteChatHistory(session.id);
    setChatHistory([welcome]);
    saveChatMessage({ task_id: session.id, role: "assistant", content: welcome.content });
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!session || !state) return null;

  return (
    <div className="h-screen overflow-hidden bg-[#0e0e0e] text-[#e7e5e5]">
      <main className="h-screen overflow-hidden px-6 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6 lg:flex-row lg:gap-6">

          {/* left — timer */}
          <section className="flex min-h-0 flex-col rounded-2xl border-2 border-[#3a3a3a] bg-[#131313] p-6 shadow-2xl shadow-black/20 lg:p-8 lg:w-[55%]">
            <div className="mb-6 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="-mt-2 inline-flex items-center gap-2 rounded-lg border-2 border-[#3a3a3a] px-4 py-2 text-sm text-[#acabaa] transition-colors hover:border-[#cdc0ec]/40 hover:text-[#e7e5e5]"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back to Dashboard
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8fa1a1]">Study Mode</p>
                  <h1 className="mt-2 font-['Manrope'] text-2xl font-light text-[#cdc0ec] lg:text-3xl">
                    {session.title}
                  </h1>
                  <p className="mt-2 text-sm text-[#acabaa]">
                    {state.courseName} • Day {state.dayIndex + 1} • {session.task_type}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#0e0e0e] px-4 py-2.5">
                <span className="material-symbols-outlined text-base text-[#767575]">schedule</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#767575]">Duration</p>
                  <p className="text-sm font-semibold text-[#cdc0ec]">{session.duration_minutes} min</p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-[#3a3a3a] bg-[#0e0e0e] px-8 py-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(205,192,236,0.06),_transparent_70%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <p className="mb-6 text-xs uppercase tracking-[0.3em] text-[#8fa1a1] font-medium">Focus Timer</p>
                  <div className="font-['Manrope'] text-8xl font-light tracking-tight text-[#cdc0ec] lg:text-9xl mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#cdc0ec]/30 to-transparent rounded-full mb-8" />
                  <p className="max-w-lg text-sm leading-relaxed text-[#acabaa]">
                    Stay focused on {topic.toLowerCase()} for this session.
                  </p>
                </div>
                <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsRunning((c) => !c)}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-[#3a3a3a] bg-[#131313] px-6 py-3 text-sm font-semibold text-[#e7e5e5] transition-all hover:border-[#cdc0ec]/40 hover:bg-[#1a1a1a] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">{isRunning ? "pause" : "play_arrow"}</span>
                    {isRunning ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => { setTimeLeft(session.duration_minutes * 60); setIsRunning(true); }}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-[#3a3a3a] bg-[#131313] px-6 py-3 text-sm font-semibold text-[#e7e5e5] transition-all hover:border-[#cdc0ec]/40 hover:bg-[#1a1a1a] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Restart
                  </button>
                  <button
                    onClick={handleCompleteSession}
                    disabled={isCompleting}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-[#3a3a3a] bg-[#131313] px-6 py-3 text-sm font-semibold text-[#e7e5e5] transition-all hover:border-[#cdc0ec]/40 hover:bg-[#1a1a1a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    {isCompleting ? "Completing..." : "Complete"}
                  </button>
                </div>
                {completionError && (
                  <p className="relative z-10 mt-4 text-sm text-[#ec7c8a]">{completionError}</p>
                )}
              </div>
            </div>
          </section>

          {/* right — sensei panel */}
          <aside className="flex min-h-0 w-full flex-col rounded-2xl border-2 border-[#3a3a3a] bg-[#131313] lg:w-[45%]">

            {/* header */}
            <div className="shrink-0 border-b border-[#484848]/20 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#4b4166]/25">
                    <img src={senseiLogo} alt="Sensei" className="h-11 w-11 object-contain" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#e7e5e5]">Sensei AI</p>
                    <p className="text-xs text-[#8fa1a1]">
                      {contentLoading ? "Loading topic guidance..." : `Ready for ${topic}`}
                    </p>
                  </div>
                </div>
                {activeTab === "Chat" && (
                  <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[#ec7c8a] hover:bg-[#ec7c8a]/10 transition-colors"
                    title="Erase conversation"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Erase
                  </button>
                )}
              </div>
            </div>

            {/* tabs */}
            <div className="shrink-0 border-b border-[#484848]/20 px-6 pt-5">
              <div className="flex gap-6 text-sm">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-3.5 font-medium transition-colors ${
                      activeTab === tab
                        ? "border-[#cdc0ec] text-[#e7e5e5]"
                        : "border-transparent text-[#767575] hover:text-[#acabaa]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">

              {/* loading skeleton */}
              {contentLoading && activeTab !== "Chat" && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1b1c1c]" />
                  ))}
                </div>
              )}

              {/* error */}
              {contentError && !contentLoading && (
                <div className="rounded-2xl bg-[#1b1c1c] p-5 text-sm text-[#ec7c8a]">
                  {contentError}
                </div>
              )}

              {/* notes tab */}
              {activeTab === "Notes" && !contentLoading && !contentError && (
                <div className="space-y-5">
                  {concepts.map((concept, i) => (
                    <div
                      key={i}
                      className="rounded-xl border-l-[3px] border-l-[#cdc0ec]/35 bg-[#161616] border border-[#202020] px-5 py-6"
                    >
                      {/* title row */}
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="text-[11px] font-mono font-bold tabular-nums text-[#cdc0ec]/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h4 className="text-[14px] font-semibold leading-snug text-[#e7e5e5]">
                          {concept.title}
                        </h4>
                      </div>

                      {/* definition */}
                      <p className="text-[13px] leading-relaxed text-[#acabaa] mb-5">
                        {concept.definition}
                      </p>

                      {/* key points */}
                      <div className="mb-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 text-[#cdc0ec]">
                          Key Points
                        </p>
                        <ul className="space-y-2.5">
                          {concept.key_points.map((point, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-[12px] text-[#e7e5e5] leading-relaxed">
                              <span className="mt-[3px] shrink-0 text-[11px] font-bold text-[#cdc0ec]">›</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* example */}
                      <div className="rounded-lg bg-[#0f0f0f] px-4 py-3.5 text-[12px] leading-relaxed text-[#8fa1a1]">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] mr-2 text-[#8fa1a1]">
                          Example —
                        </span>
                        {concept.example}
                      </div>

                      {/* code block */}
                      {concept.code_example && (
                        <div className="mt-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-[#7fd29a]">
                            Code Example
                          </p>
                          <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] px-4 py-3.5 text-[11px] text-[#7fd29a] font-mono leading-relaxed whitespace-pre">
                            {concept.code_example}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* practice questions tab */}
              {activeTab === "Practice Questions" && !contentLoading && !contentError && (
                <div className="space-y-5">
                  {practiceQuestions.map((pq, i) => (
                    <div key={i} className="rounded-xl border-l-[3px] border-l-[#8fa1a1]/40 bg-[#161616] border border-[#202020] px-5 py-6">
                      {/* number + question */}
                      <div className="flex items-start gap-2.5 mb-5">
                        <span className="text-[11px] font-mono font-bold tabular-nums text-[#8fa1a1]/70 mt-[2px] shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[13px] font-semibold leading-relaxed text-[#e7e5e5]">
                          {pq.question}
                        </p>
                      </div>

                      {/* answer */}
                      <div>
                        <button
                          onClick={() => setExpandedAnswers((prev) => {
                            const next = new Set(prev);
                            next.has(i) ? next.delete(i) : next.add(i);
                            return next;
                          })}
                          className="flex items-center gap-1.5 mb-2.5 group"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8fa1a1] group-hover:text-[#a8bcbc] transition-colors">
                            {expandedAnswers.has(i) ? "Hide Answer" : "Click to Reveal"}
                          </span>
                          <span className={`material-symbols-outlined text-[13px] text-[#8fa1a1] group-hover:text-[#a8bcbc] transition-all duration-200 ${expandedAnswers.has(i) ? "rotate-180" : ""}`}>
                            expand_more
                          </span>
                        </button>
                        {expandedAnswers.has(i) && (
                          <div className="rounded-lg bg-[#0f0f0f] px-4 py-3.5 text-[12px] leading-relaxed text-[#acabaa]">
                            {pq.answer}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* chat tab */}
              {activeTab === "Chat" && (
                <div className="flex flex-col gap-3">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        msg.role === "assistant"
                          ? "rounded-tl-sm bg-[#4b4166]/35 text-[#dbcefb]"
                          : "ml-auto rounded-tr-sm bg-[#1b1c1c] text-[#e7e5e5]"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {chatSending && (
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#4b4166]/35 p-4 text-sm text-[#dbcefb]">
                      <span className="animate-pulse">Sensei is thinking...</span>
                    </div>
                  )}
                  {chatError && (
                    <p className="text-xs text-[#ec7c8a]">{chatError}</p>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>

            {/* chat input — only visible on Chat tab */}
            {activeTab === "Chat" && (
              <div className="shrink-0 border-t border-[#484848]/20 p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-[#484848]/20 bg-[#171818] px-4 py-3">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder={`Ask Sensei about ${topic.toLowerCase()}...`}
                    rows={1}
                    disabled={chatSending}
                    className="flex-1 resize-none bg-transparent text-sm text-[#e7e5e5] placeholder-[#767575] outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatSending || !chatInput.trim()}
                    className="shrink-0 rounded-lg bg-[#4b4166]/50 px-3 py-2 text-xs text-[#cdc0ec] transition-opacity disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-[#484848]">Enter to send · Shift+Enter for new line</p>
              </div>
            )}
          </aside>

        </div>
      </main>
    </div>
  );
}
