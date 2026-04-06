import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import senseiLogo from "../assets/sensei.png";
import type { PlannerStudyTask } from "../types/planner";

type StudyModeLocationState = {
  courseId: number;
  courseName: string;
  task: PlannerStudyTask;
  dayIndex: number;
};

type MaterialSection = {
  label: string;
  content: string[];
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function deriveTopicFromTitle(title: string) {
  return title
    .replace(/^(Study|Continue|Revisit|Review)\s+/i, "")
    .replace(/\s+using\s+.+$/i, "")
    .trim();
}

function buildMockMaterials(topic: string): MaterialSection[] {
  return [
    {
      label: "Concepts",
      content: [
        `${topic} is best understood by identifying the core definition, why it matters, and when it is used.`,
        `Focus first on the main vocabulary, then map how ${topic.toLowerCase()} connects to earlier ideas in your plan.`,
        `Try to explain ${topic.toLowerCase()} in one simple sentence before moving into details.`,
      ],
    },
    {
      label: "Practice Questions",
      content: [
        `What problem does ${topic.toLowerCase()} help solve?`,
        `How would you explain ${topic.toLowerCase()} to a classmate in under 30 seconds?`,
        `What is one mistake people often make when working with ${topic.toLowerCase()}?`,
      ],
    },
    {
      label: "Chat",
      content: [
        `How would you like me to simplify ${topic.toLowerCase()}?`,
        `I can walk you through the core idea, give a real-world example, or quiz you on ${topic.toLowerCase()}.`,
      ],
    },
  ];
}

export default function StudyModePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as StudyModeLocationState | null;

  const session = state?.task;
  const topic = useMemo(() => deriveTopicFromTitle(session?.title ?? "this topic"), [session?.title]);
  const materialSections = useMemo(() => buildMockMaterials(topic), [topic]);
  const [activeTab, setActiveTab] = useState(materialSections[0]?.label ?? "Concepts");
  const [isRunning, setIsRunning] = useState(true);
  const [timeLeft, setTimeLeft] = useState(session ? session.duration_minutes * 60 : 0);

  useEffect(() => {
    if (!session) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    setTimeLeft(session ? session.duration_minutes * 60 : 0);
  }, [session]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    setActiveTab(materialSections[0]?.label ?? "Concepts");
  }, [materialSections]);

  if (!session || !state) {
    return null;
  }

  const activeSection = materialSections.find((section) => section.label === activeTab) ?? materialSections[0];

  return (
    <div className="h-screen overflow-hidden bg-[#0e0e0e] text-[#e7e5e5]">
      <main className="h-screen overflow-hidden p-6 lg:p-8">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6 lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col rounded-3xl border border-[#484848]/20 bg-[#131313] p-6 shadow-2xl shadow-black/20 lg:p-8">
            <div className="mb-6 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="-mt-2 inline-flex items-center gap-2 rounded-full border border-[#484848]/30 px-4 py-2 text-sm text-[#acabaa] transition-colors hover:border-[#cdc0ec]/30 hover:text-[#e7e5e5]"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back to Dashboard
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8fa1a1]">Study Mode</p>
                  <h1 className="mt-2 font-[\'Manrope\'] text-2xl font-light text-[#cdc0ec] lg:text-3xl">
                    {session.title}
                  </h1>
                  <p className="mt-2 text-sm text-[#acabaa]">
                    {state.courseName} • Day {state.dayIndex + 1} • {session.task_type}
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-2xl border border-[#484848]/20 bg-[#0e0e0e] px-6 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#767575]">Session Length</p>
                <p className="mt-2 text-2xl font-semibold text-[#edbbb1]">{session.duration_minutes} min</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl border border-[#484848]/10 bg-[radial-gradient(circle_at_top,_rgba(205,192,236,0.08),_transparent_45%)] px-8 py-12 text-center">
                <p className="mb-8 text-xs uppercase tracking-[0.3em] text-[#767575]">Focus Timer</p>
                <div className="font-[\'Manrope\'] text-8xl font-light tracking-tight text-[#f4efff] lg:text-9xl">
                  {formatTime(timeLeft)}
                </div>
                <p className="mt-8 max-w-lg text-base leading-relaxed text-[#acabaa]">
                  Stay focused on {topic.toLowerCase()} for this session.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => setIsRunning((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#6b5c96] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6b5c96]/20 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-[#6b5c96]/30"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isRunning ? "pause" : "play_arrow"}
                    </span>
                    {isRunning ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => setTimeLeft(session.duration_minutes * 60)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#484848]/30 bg-[#171818] px-7 py-3.5 text-sm font-semibold text-[#e7e5e5] transition-all hover:border-[#8fa1a1]/40 hover:bg-[#1d1e1e]"
                  >
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Restart
                  </button>
                  <button
                    onClick={() => navigate(`/planner/${state.courseId}`)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#484848]/30 bg-[#171818] px-7 py-3.5 text-sm font-semibold text-[#e7e5e5] transition-all hover:border-[#8fa1a1]/40 hover:bg-[#1d1e1e]"
                  >
                    <span className="material-symbols-outlined text-lg">skip_next</span>
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 w-full flex-col rounded-3xl border border-[#484848]/20 bg-[#131313] lg:w-[440px]">
            <div className="shrink-0 border-b border-[#484848]/20 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#4b4166]/25">
                  <img src={senseiLogo} alt="Sensei" className="h-11 w-11 object-contain" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#e7e5e5]">Sensei AI</p>
                  <p className="text-xs text-[#8fa1a1]">Preparing topic guidance...</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-[#484848]/20 px-6 pt-5">
              <div className="flex gap-6 text-sm text-[#acabaa]">
                {materialSections.map((section) => {
                  const isActive = section.label === activeTab;
                  return (
                    <button
                      key={section.label}
                      onClick={() => setActiveTab(section.label)}
                      className={`border-b-2 pb-3.5 font-medium transition-colors ${
                        isActive
                          ? "border-[#cdc0ec] text-[#e7e5e5]"
                          : "border-transparent text-[#767575] hover:text-[#acabaa]"
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="rounded-2xl bg-[#171818] p-5 text-sm leading-relaxed text-[#d8d5de]">
                <p>
                  Here&apos;s a focused starter pack for <span className="text-[#cdc0ec]">{topic}</span>. This is mocked for now, but the layout is ready for live agent responses.
                </p>
              </div>

              {activeSection?.label === "Chat" ? (
                <div className="mt-5 space-y-4">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#4b4166]/35 p-4 text-sm leading-relaxed text-[#dbcefb]">
                    How&apos;s the session going so far? I can break down <span className="text-[#cdc0ec]">{topic}</span> into simpler steps if you want.
                  </div>
                  {activeSection.content.map((item, index) => (
                    <div key={`${activeSection.label}-${index}`} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1b1c1c] p-4 text-sm leading-relaxed text-[#e7e5e5]">
                      {item}
                    </div>
                  ))}
                  <div className="rounded-2xl border border-[#484848]/20 bg-[#171818] px-4 py-3.5 text-sm text-[#767575]">
                    Ask Sensei AI anything about {topic.toLowerCase()}...
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {activeSection?.content.map((item, index) => (
                    <div key={`${activeSection.label}-${index}`} className="rounded-2xl bg-[#1b1c1c] p-5 text-sm leading-relaxed text-[#e7e5e5]">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
