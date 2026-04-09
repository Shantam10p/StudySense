import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { fetchCourse, fetchCoursePlan } from "../api";
import { Sidebar } from "../components/Sidebar";
import { Loader } from "../components/Loader";
import type { Course } from "../types/course";
import type { PlannerGenerateResponse } from "../types/planner";

export default function PlannerViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [plan, setPlan] = useState<PlannerGenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generatedWarning = (location.state as { generatedWarning?: string | null } | null)?.generatedWarning;

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
          <Loader message="Loading study plan..." size="lg" />
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

          {generatedWarning && (
            <div className="bg-[#4b4166]/20 border border-[#cdc0ec]/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#cdc0ec] text-base mt-0.5">info</span>
                <p className="text-sm text-[#dbcefb]">{generatedWarning}</p>
              </div>
            </div>
          )}

          {course && (
            <div className="bg-[#131313] border-2 border-[#3a3a3a] rounded-xl p-6 mb-8 shadow-lg shadow-black/20">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Daily Study Schedule</h3>
                <span className="text-xs text-[#767575] tracking-wide uppercase">{plan.daily_plans.length} days</span>
              </div>

              {plan.daily_plans.map((dailyPlan, index) => {
                const totalMinutes = dailyPlan.tasks.reduce((sum, t) => sum + t.duration_minutes, 0);
                const taskTypeColors: Record<string, string> = {
                  study: "bg-[#4b4166]/30 text-[#cdc0ec]",
                  review: "bg-[#2d4a4a]/30 text-[#8fa1a1]",
                  practice: "bg-[#4a3530]/30 text-[#edbbb1]",
                  quiz: "bg-[#3a4130]/30 text-[#a8c97a]",
                };

                return (
                  <div key={dailyPlan.id} className="group bg-[#131313] rounded-xl p-5">
                    <div className="flex items-center gap-3 pb-4">
                      <div className="w-7 h-7 rounded-full bg-[#4b4166]/40 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-[#cdc0ec]">{index + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-[#e7e5e5]">{dailyPlan.day}</p>
                      <div className="flex-1 h-px bg-[#484848]/20"></div>
                      <span className="text-[11px] text-[#767575]">{dailyPlan.tasks.length} tasks • {totalMinutes}m</span>
                    </div>

                    <div className="ml-3.5 pl-6 pt-1 space-y-2">
                      {dailyPlan.tasks.map((task) => {
                        const typeKey = task.task_type.toLowerCase();
                        const typeColor = taskTypeColors[typeKey] || "bg-[#4b4166]/20 text-[#cdc0ec]";

                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2a2a2a]/50 hover:border-[#3a3a3a] transition-all cursor-default"
                          >
                            <div className="w-1 h-4 rounded-full bg-[#cdc0ec]/40 shrink-0"></div>
                            <span className="text-[13px] text-[#e7e5e5] flex-1 truncate">{task.title}</span>
                            <span className="text-[11px] text-[#767575] shrink-0">{task.duration_minutes}m</span>
                            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${typeColor}`}>
                              {task.task_type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
