import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { generatePlan } from "../api/index";
import { Sidebar } from "../components/Sidebar";

export default function PlannerPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(2);
  const [topicsText, setTopicsText] = useState("");
  const [textbook, setTextbook] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const topics = topicsText
      .split(/\n|,/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const payload = {
        course_name: courseName,
        exam_date: examDate,
        topics,
        daily_study_hours: dailyStudyHours,
        ...(textbook.trim() ? { textbook: textbook.trim() } : {}),
      };

      const data = await generatePlan(payload);
      navigate(`/planner/${data.course_id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="space-y-2">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">AI-Powered Planning</span>
            <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
              Create Study Plan
            </h2>
            <p className="text-[#acabaa] text-sm">Let Sensei's AI design your personalized learning path</p>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl">
          <form onSubmit={onGenerate} className="bg-[#131313] border border-[#484848]/20 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Course Name
                </label>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  placeholder="e.g. Organic Chemistry"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Daily Study Hours
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={dailyStudyHours}
                  onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Textbook <span className="text-[#767575]">(optional)</span>
                </label>
                <input
                  value={textbook}
                  onChange={(e) => setTextbook(e.target.value)}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  placeholder="e.g. Campbell Biology"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Topics <span className="text-[#767575]">(comma or newline separated)</span>
                </label>
                <textarea
                  value={topicsText}
                  onChange={(e) => setTopicsText(e.target.value)}
                  className="w-full min-h-32 bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors resize-none"
                  placeholder="Limits, Derivatives, Integrals&#10;Series&#10;Optimization"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-3">
                <p className="text-sm text-[#ec7c8a]">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-medium py-2.5 px-5 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>Generating AI Plan...</span>
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
          </form>
        </div>
      </main>
    </div>
  );
}
