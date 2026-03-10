
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { generatePlan } from "../api/index";
import { Button } from "../components/Button";
import type { PlannerGenerateResponse } from "../types/planner";

export default function PlannerPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(2);
  const [topicsText, setTopicsText] = useState("");
  const [textbook, setTextbook] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlannerGenerateResponse | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

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
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E0E7FF]">
      <div className="px-6 pt-6">
        <Button onClick={() => navigate("/")}>Back</Button>
      </div>

      <main className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Create Study Plan
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Course name
              </span>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Organic Chemistry"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Exam date
              </span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Daily study hours
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={dailyStudyHours}
                onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Textbook (optional)
              </span>
              <input
                value={textbook}
                onChange={(e) => setTextbook(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Campbell Biology"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Topics (comma or newline separated)
              </span>
              <textarea
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                className="mt-1 w-full min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={"Limits, Derivatives, Integrals\nSeries\nOptimization"}
              />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>

        {result ? (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {result.course_name}
                </h2>
                <p className="text-sm text-slate-600">Exam: {result.exam_date}</p>
              </div>
              <p className="text-sm text-slate-500">Days: {result.daily_plans.length}</p>
            </div>

            <div className="mt-4 space-y-4">
              {result.daily_plans.map((dp) => (
                <div key={dp.day} className="rounded-lg border border-slate-200 p-4">
                  <div className="text-sm font-medium text-slate-900">{dp.day}</div>
                  <div className="mt-3 space-y-2">
                    {dp.tasks.map((task, idx) => (
                      <div
                        key={`${task.title}-${idx}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="text-slate-800">{task.title}</div>
                        <div className="text-slate-600">
                          {task.duration_minutes}m · {task.task_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
