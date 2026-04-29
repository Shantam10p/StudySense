import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generatePlan } from "../api/index";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useSidebar } from "../context/SidebarContext";

export default function PlannerPage() {
  const navigate = useNavigate();
  const { toggle } = useSidebar();
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(2);
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [textbook, setTextbook] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const LOADING_MESSAGES = [
    "Sensei is reading your topics...",
    "Analysing difficulty and priority...",
    "Designing your study schedule...",
    "Balancing sessions across days...",
    "Almost ready...",
  ];

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const addTopic = () => {
    const trimmed = currentTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setCurrentTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTopic(); }
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newTopics = [...topics];
    const draggedTopic = newTopics[draggedIndex];
    newTopics.splice(draggedIndex, 1);
    newTopics.splice(index, 0, draggedTopic);
    setTopics(newTopics);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const PENDING_PLAN_KEY = "sensei_pending_plan";

  async function runGenerate(payload: { course_name: string; exam_date: string; topics: string[]; daily_study_hours: number; textbook?: string }) {
    setLoading(true);
    setError(null);
    sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(payload));
    try {
      const data = await generatePlan(payload);
      sessionStorage.removeItem(PENDING_PLAN_KEY);
      navigate(`/planner/${data.course_id}`, {
        state: { generatedWarning: data.warning ?? null, unscheduled: data.unscheduled ?? [] },
      });
    } catch (err: any) {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
      setError(err?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (topics.length === 0) { setError("Please add at least one topic"); return; }
    runGenerate({
      course_name: courseName,
      exam_date: examDate,
      topics,
      daily_study_hours: dailyStudyHours,
      ...(textbook.trim() ? { textbook: textbook.trim() } : {}),
    });
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_PLAN_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      setCourseName(pending.course_name ?? "");
      setExamDate(pending.exam_date ?? "");
      setTopics(pending.topics ?? []);
      setDailyStudyHours(pending.daily_study_hours ?? 2);
      setTextbook(pending.textbook ?? "");
      runGenerate(pending);
    } catch {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
    }
  }, []);

  const inputClass = "w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors text-sm";

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col pb-20 md:pb-0">

        {/* ── Mobile top bar ─────────────────────────── */}
        <header className="flex md:hidden items-center gap-3 px-4 pt-4 pb-3 sticky top-0 bg-[#0e0e0e] z-30">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-[#4b4166] flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[#cdc0ec] text-xl">menu</span>
          </button>
          <span className="font-['Manrope'] font-bold text-xl text-[#cdc0ec]">New Study Plan</span>
        </header>

        {/* ── Desktop header ──────────────────────────── */}
        <header className="hidden md:flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="space-y-2">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">AI-Powered Planning</span>
            <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
              Create Study Plan
            </h2>
            <p className="text-[#acabaa] text-sm">Let Sensei design your personalized learning path</p>
          </div>
        </header>

        <div className="px-4 md:px-12 pb-8 max-w-screen-2xl">
          {/* Mobile subtitle */}
          <p className="md:hidden text-[#acabaa] text-sm mb-4">Let Sensei design your personalized learning path</p>

          <form onSubmit={onGenerate} className="bg-[#131313] border border-[#484848]/20 rounded-xl p-5 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">Course Name</label>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Data Structures"
                  required
                />
              </div>

              <div className="min-w-0">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-[#e7e5e5]">Target Date</label>
                  <p className="text-xs text-[#767575] hidden md:block mt-0.5">(When do you want to be ready by?)</p>
                </div>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className={`${inputClass} w-full max-w-full appearance-none block`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">Daily Study Hours</label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={dailyStudyHours}
                  onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="block text-sm font-medium text-[#e7e5e5]">Relevant Documents</label>
                  <p className="text-xs text-[#767575] hidden md:block">(optional)</p>
                </div>
                <input
                  value={textbook}
                  onChange={(e) => setTextbook(e.target.value)}
                  disabled
                  className="w-full cursor-not-allowed bg-[#181919] border border-[#484848]/20 rounded-lg px-4 py-3 text-[#767575] placeholder:text-[#5f5f5f] transition-colors opacity-70 text-sm"
                  placeholder="Document uploads coming soon"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Topics <span className="text-[#767575]">(in order)</span>
                </label>

                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#1f2020] border border-[#484848]/30 rounded-lg">
                    {topics.map((topic, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`inline-flex items-center gap-2 bg-[#4b4166]/40 border border-[#cdc0ec]/30 rounded-full px-3 py-1.5 text-sm text-[#cdc0ec] group hover:bg-[#4b4166]/60 transition-all cursor-move ${
                          draggedIndex === index ? "opacity-50 scale-95" : ""
                        }`}
                      >
                        <span className="material-symbols-outlined text-base text-[#cdc0ec]/40">drag_indicator</span>
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="text-[#cdc0ec]/60 hover:text-[#ec7c8a] transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 w-full overflow-hidden">
                  <input
                    type="text"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    onKeyDown={handleTopicKeyDown}
                    className={`${inputClass} flex-1 min-w-0`}
                    placeholder="e.g. Arrays, Linked Lists, Binary Trees"
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    disabled={!currentTopic.trim()}
                    className="bg-[#cdc0ec] text-[#443b5f] w-12 shrink-0 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium text-sm"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span className="hidden md:inline">Add Topic</span>
                  </button>
                </div>

                {topics.length === 0 && (
                  <p className="text-xs text-[#767575] mt-2">Add at least one topic to continue</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-5 bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-3">
                <p className="text-sm text-[#ec7c8a]">{error}</p>
              </div>
            )}

            {/* Desktop CTA */}
            <div className="hidden md:flex mt-6 items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-medium py-2.5 px-5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span className="transition-all duration-500">{LOADING_MESSAGES[loadingMsgIdx]}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="text-[#acabaa] hover:text-[#e7e5e5] font-medium transition-colors text-sm"
              >
                Cancel
              </button>
            </div>

            {/* Mobile CTA — full width inside form */}
            <div className="md:hidden mt-5 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span className="transition-all duration-500">{LOADING_MESSAGES[loadingMsgIdx]}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Generate Plan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="w-full py-3 text-[#acabaa] font-medium text-sm text-center"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
