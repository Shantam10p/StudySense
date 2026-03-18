import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchCourse, fetchCoursePlan } from "../api";
import { Button } from "../components/Button";
import type { Course } from "../types/course";
import type { PlannerGenerateResponse } from "../types/planner";

export default function PlannerViewPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [plan, setPlan] = useState<PlannerGenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlannerView(targetCourseId: number) {
      setLoading(true);
      setError(null);
      try {
        const [courseData, planData] = await Promise.all([
          fetchCourse(targetCourseId),
          fetchCoursePlan(targetCourseId),
        ]);
        setCourse(courseData);
        setPlan(planData);
      } catch (err: any) {
        setError(err?.message || "Failed to load plan");
      } finally {
        setLoading(false);
      }
    }

    const parsedCourseId = Number(courseId);
    if (!courseId || Number.isNaN(parsedCourseId)) {
      setError("Invalid course id");
      setLoading(false);
      return;
    }

    loadPlannerView(parsedCourseId);
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E0E7FF]">
      <div className="px-6 pt-6">
        <Button onClick={() => navigate("/courses")}>Back</Button>
      </div>

      <main className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Study Plan</h1>
        </div>

        {loading ? <p className="text-slate-600">Loading plan...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {course ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Course</p>
                <p className="mt-1 text-base font-medium text-slate-900">{course.course_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Exam date</p>
                <p className="mt-1 text-base font-medium text-slate-900">{course.exam_date}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Daily study hours</p>
                <p className="mt-1 text-base font-medium text-slate-900">{course.daily_study_hours}h</p>
              </div>
            </div>
          </div>
        ) : null}

        {plan ? (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{plan.course_name}</h2>
                <p className="text-sm text-slate-600">Exam: {plan.exam_date}</p>
              </div>
              <p className="text-sm text-slate-500">Days: {plan.daily_plans.length}</p>
            </div>

            <div className="mt-4 space-y-4">
              {plan.daily_plans.map((dailyPlan) => (
                <div key={dailyPlan.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="text-sm font-medium text-slate-900">{dailyPlan.day}</div>
                  <div className="mt-3 space-y-2">
                    {dailyPlan.tasks.map((task) => (
                      <div
                        key={task.id}
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
