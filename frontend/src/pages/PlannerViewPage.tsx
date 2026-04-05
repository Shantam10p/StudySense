import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchCourse, fetchCoursePlan } from "../api";
import { Sidebar } from "../components/Sidebar";
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-[#acabaa]">Loading study plan...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">Study Plan</span>
              <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
                {course?.course_name || "Course Plan"}
              </h2>
            </div>
            <button
              onClick={() => navigate("/courses")}
              className="px-4 py-2 text-[#acabaa] hover:text-[#e7e5e5] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to Courses</span>
            </button>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl">
          {error && (
            <div className="bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#ec7c8a]">{error}</p>
            </div>
          )}

          {course && (
            <div className="bg-[#131313] border border-[#484848]/20 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4b4166]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#cdc0ec]">school</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Course</p>
                    <p className="text-base font-medium text-[#e7e5e5]">{course.course_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4b4166]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#8fa1a1]">event</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Exam Date</p>
                    <p className="text-base font-medium text-[#e7e5e5]">{course.exam_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4b4166]/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#edbbb1]">schedule</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Daily Hours</p>
                    <p className="text-base font-medium text-[#e7e5e5]">{course.daily_study_hours}h</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {plan && (
            <div className="bg-[#131313] border border-[#484848]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Daily Study Schedule</h3>
                <div className="flex items-center gap-2 text-sm text-[#acabaa]">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  <span>{plan.daily_plans.length} days</span>
                </div>
              </div>

              <div className="space-y-4">
                {plan.daily_plans.map((dailyPlan, index) => (
                  <div
                    key={dailyPlan.id}
                    className="bg-[#1f2020] border border-[#484848]/20 rounded-lg p-5 hover:border-[#cdc0ec]/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#4b4166]/40 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#cdc0ec]">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e7e5e5]">{dailyPlan.day}</p>
                        <p className="text-xs text-[#acabaa]">{dailyPlan.tasks.length} tasks</p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-11">
                      {dailyPlan.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-3 p-3 bg-[#0e0e0e] rounded-lg border border-[#484848]/10"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="material-symbols-outlined text-[#8fa1a1] text-base">task_alt</span>
                            <span className="text-sm text-[#e7e5e5]">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#acabaa]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {task.duration_minutes}m
                            </span>
                            <span className="px-2 py-1 bg-[#4b4166]/20 rounded text-[#cdc0ec]">
                              {task.task_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
