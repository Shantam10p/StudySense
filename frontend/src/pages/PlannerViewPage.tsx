import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchCourse, fetchCoursePlan } from "../api";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { Loader } from "../components/Loader";
import { useSidebar } from "../context/SidebarContext";
import type { Course } from "../types/course";
import type { PlannerGenerateResponse } from "../types/planner";

export default function PlannerViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const { toggle } = useSidebar();
  const [course, setCourse] = useState<Course | null>(null);
  const [plan, setPlan] = useState<PlannerGenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationState = location.state as { unscheduled?: string[] } | null;
  const justCreated = locationState !== null && "unscheduled" in (locationState ?? {});

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

  const taskTypeColors: Record<string, string> = {
    study: "bg-[#4b4166]/30 text-[#cdc0ec]",
    review: "bg-[#2d4a4a]/30 text-[#8fa1a1]",
    practice: "bg-[#4a3530]/30 text-[#edbbb1]",
    quiz: "bg-[#3a4130]/30 text-[#a8c97a]",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <Loader message="Loading study plan..." size="lg" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col pb-20 md:pb-0 min-w-0">

        {/* ── Mobile top bar ─────────────────────────── */}
        <header className="flex md:hidden items-center gap-3 px-4 pt-4 pb-3 sticky top-0 bg-[#0e0e0e] z-30">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-[#4b4166] flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[#cdc0ec] text-xl">menu</span>
          </button>
          <span className="font-['Manrope'] font-bold text-xl text-[#cdc0ec] truncate">
            {course?.course_name || "Study Plan"}
          </span>
        </header>

        {/* ── Desktop header ──────────────────────────── */}
        <header className="hidden md:flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
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

        <div className="px-4 md:px-12 pb-8 w-full min-w-0">
          {error && (
            <div className="bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#ec7c8a]">{error}</p>
            </div>
          )}

          {/* Plan ready banner */}
          {justCreated && (
            <div className="bg-[#141a1f] border border-[#6db8d4]/30 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6db8d4]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#6db8d4] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#e7e5e5]">Your study plan is ready!</p>
                  <p className="text-xs text-[#acabaa] mt-0.5 hidden md:block">Head to the dashboard to start your first session.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#6db8d4]/15 hover:bg-[#6db8d4]/25 text-[#6db8d4] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Dashboard
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Course info card */}
          {course && (
            <div className="bg-[#131313] border-2 border-[#3a3a3a] rounded-xl p-4 md:p-6 mb-6 shadow-lg shadow-black/20">
              {/* Mobile: stacked rows */}
              <div className="md:hidden flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#cdc0ec] text-base shrink-0">school</span>
                  <div>
                    <p className="text-[10px] text-[#acabaa] uppercase tracking-widest">Course</p>
                    <p className="text-sm font-medium text-[#e7e5e5]">{course.course_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#8fa1a1] text-base shrink-0">event</span>
                  <div>
                    <p className="text-[10px] text-[#acabaa] uppercase tracking-widest">Target Date</p>
                    <p className="text-sm font-medium text-[#e7e5e5]">{course.exam_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#edbbb1] text-base shrink-0">schedule</span>
                  <div>
                    <p className="text-[10px] text-[#acabaa] uppercase tracking-widest">Daily Hours</p>
                    <p className="text-sm font-medium text-[#e7e5e5]">{course.daily_study_hours}h/day</p>
                  </div>
                </div>
              </div>

              {/* Desktop: grid */}
              <div className="hidden md:grid grid-cols-3 gap-6">
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
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Target Date</p>
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

          {/* Daily schedule */}
          {plan && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg md:text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Daily Schedule</h3>
                <span className="text-xs text-[#767575] tracking-wide uppercase">{plan.daily_plans.length} days</span>
              </div>

              {plan.daily_plans.map((dailyPlan, index) => {
                const totalMinutes = dailyPlan.tasks.reduce((sum, t) => sum + t.duration_minutes, 0);
                return (
                  <div key={dailyPlan.id} className="bg-[#131313] rounded-xl p-4 md:p-5">
                    {/* Day header */}
                    <div className="flex items-center gap-3 pb-3">
                      <div className="w-7 h-7 rounded-full bg-[#4b4166]/40 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-[#cdc0ec]">{index + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-[#e7e5e5]">{dailyPlan.day}</p>
                      <div className="flex-1 h-px bg-[#484848]/20" />
                      <span className="text-[11px] text-[#767575]">{dailyPlan.tasks.length} tasks • {totalMinutes}m</span>
                    </div>

                    {/* Tasks */}
                    <div className="pt-1 space-y-2 min-w-0">
                      {dailyPlan.tasks.map((task) => {
                        const typeKey = task.task_type.toLowerCase();
                        const typeColor = taskTypeColors[typeKey] || "bg-[#4b4166]/20 text-[#cdc0ec]";
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]/50 transition-all"
                          >
                            <div className="w-1 h-4 rounded-full bg-[#cdc0ec]/40 shrink-0" />
                            <span className="text-[13px] text-[#e7e5e5] flex-1 truncate">{task.title}</span>
                            <span className="text-[11px] text-[#767575] shrink-0">{task.duration_minutes}m</span>
                            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block ${typeColor}`}>
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

          {/* Mobile back button */}
          <button
            onClick={() => navigate("/courses")}
            className="md:hidden mt-6 w-full flex items-center justify-center gap-2 py-3 text-[#acabaa] text-sm font-medium border border-[#2a2a2a] rounded-xl hover:border-[#3a3a3a] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Courses
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
