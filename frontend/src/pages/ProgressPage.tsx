import { useEffect, useState } from "react";
import { fetchCourses, fetchCoursePlan, fetchDashboardStats } from "../api";
import { getCourseStyle } from "../utils/courseStyle";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { Loader } from "../components/Loader";
import { useSidebar } from "../context/SidebarContext";
import type { Course } from "../types/course";
import type { DashboardStats } from "../types/dashboard";
import type { PlannerGenerateResponse } from "../types/planner";

export default function ProgressPage() {
  const { toggle } = useSidebar();
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Map<number, PlannerGenerateResponse>>(new Map());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    sessions_today: 0,
    total_time_minutes: 0,
    completed_sessions: 0,
    day_streak: 0,
    completed_task_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgressData() {
      try {
        const [coursesData, statsData] = await Promise.all([fetchCourses(), fetchDashboardStats()]);
        setCourses(coursesData);
        setDashboardStats(statsData);

        const plansMap = new Map<number, PlannerGenerateResponse>();
        for (const course of coursesData) {
          try {
            const planData = await fetchCoursePlan(course.id);
            plansMap.set(course.id, planData);
          } catch (err) {
            console.error(`Failed to load plan for course ${course.id}`, err);
          }
        }
        setPlans(plansMap);
      } catch (err: any) {
        setError(err?.message || "Failed to load progress data");
      } finally {
        setLoading(false);
      }
    }
    loadProgressData();
  }, []);

  const calculateCourseProgress = (courseId: number) => {
    const plan = plans.get(courseId);
    if (!plan) return { completed: 0, total: 0, percentage: 0 };
    const totalTasks = plan.daily_plans.reduce((sum, day) => sum + day.tasks.length, 0);
    const completedTasks = plan.daily_plans.reduce(
      (sum, day) => sum + day.tasks.filter((task) => dashboardStats.completed_task_ids.includes(task.id)).length,
      0,
    );
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  const calculateOverallProgress = () => {
    let totalTasks = 0;
    const completedTaskIds = new Set(dashboardStats.completed_task_ids);
    plans.forEach((plan) => {
      totalTasks += plan.daily_plans.reduce((sum, day) => sum + day.tasks.length, 0);
    });
    const completedTasks = completedTaskIds.size;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { completed: completedTasks, total: totalTasks, percentage };
  };

  const overallProgress = calculateOverallProgress();

  // SVG circle ring values
  const RADIUS = 88;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressOffset = CIRCUMFERENCE - (overallProgress.percentage / 100) * CIRCUMFERENCE;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <div className="fixed inset-0 md:ml-64 flex items-center justify-center">
          <Loader message="Loading progress..." size="lg" />
        </div>
        <BottomNav />
      </div>
    );
  }

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
          <span className="font-['Manrope'] font-bold text-xl text-[#cdc0ec]">Progress</span>
        </header>

        {/* ── Desktop header ──────────────────────────── */}
        <header className="hidden md:flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="space-y-2">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">Analytics</span>
            <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
              Your Progress
            </h2>
          </div>
        </header>

        <div className="px-4 md:px-12 pb-8 max-w-screen-2xl w-full">
          {error && <p className="text-sm text-[#ec7c8a] mb-6">{error}</p>}

          {/* ── Mobile layout ──────────────────────────── */}
          <div className="md:hidden flex flex-col gap-6">

            {/* Progress ring */}
            <section className="flex flex-col items-center pt-2 pb-2">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Track */}
                  <circle
                    cx="100" cy="100" r={RADIUS}
                    fill="none"
                    stroke="#252626"
                    strokeWidth="12"
                  />
                  {/* Progress */}
                  <circle
                    cx="100" cy="100" r={RADIUS}
                    fill="none"
                    stroke="url(#progressGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#bfb2de" />
                      <stop offset="100%" stopColor="#cdc0ec" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['Manrope'] font-extrabold text-5xl text-[#cdc0ec] tracking-tighter leading-none">
                    {overallProgress.percentage}%
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#acabaa] mt-1">Overall</span>
                </div>
              </div>
              <p className="mt-4 text-center text-[#acabaa] text-sm leading-relaxed max-w-[260px]">
                <span className="text-[#cdc0ec] font-semibold">{overallProgress.completed}</span> of{" "}
                <span className="text-[#e7e5e5] font-semibold">{overallProgress.total}</span> tasks completed
              </p>
            </section>

            {/* Stat chips */}
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-[#131313] rounded-xl p-3 flex flex-col items-center gap-1 border border-[#2a2a2a]">
                <span className="material-symbols-outlined text-[#edbbb1] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                <span className="font-['Manrope'] font-bold text-lg text-[#e7e5e5]">{dashboardStats.day_streak}</span>
                <span className="text-[10px] text-[#acabaa] uppercase tracking-wider">Streak</span>
              </div>
              <div className="bg-[#131313] rounded-xl p-3 flex flex-col items-center gap-1 border border-[#2a2a2a]">
                <span className="material-symbols-outlined text-[#8fa1a1] text-xl">schedule</span>
                <span className="font-['Manrope'] font-bold text-lg text-[#e7e5e5]">
                  {Math.round((dashboardStats.total_time_minutes ?? 0) / 60 * 10) / 10}h
                </span>
                <span className="text-[10px] text-[#acabaa] uppercase tracking-wider">Time</span>
              </div>
              <div className="bg-[#131313] rounded-xl p-3 flex flex-col items-center gap-1 border border-[#2a2a2a]">
                <span className="material-symbols-outlined text-[#cdc0ec] text-xl">task_alt</span>
                <span className="font-['Manrope'] font-bold text-lg text-[#e7e5e5]">{overallProgress.completed}</span>
                <span className="text-[10px] text-[#acabaa] uppercase tracking-wider">Done</span>
              </div>
            </section>

            {/* Course breakdown */}
            <section className="flex flex-col gap-3">
              <h2 className="font-['Manrope'] font-bold text-xl text-[#e7e5e5]">Course Breakdown</h2>
              {courses.length === 0 ? (
                <div className="bg-[#131313] rounded-xl p-6 text-center border border-[#2a2a2a]">
                  <p className="text-[#acabaa] text-sm">No courses yet. Create a study plan to get started.</p>
                </div>
              ) : (
                courses.map((course) => {
                  const progress = calculateCourseProgress(course.id);
                  const style = getCourseStyle(course.id, courses.map(c => c.id));
                  return (
                    <div key={course.id} className="bg-[#131313] rounded-xl p-4 border border-[#2a2a2a] flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${style.text}`}>
                            {course.course_name}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-[#acabaa]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">event</span>
                              {course.exam_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {course.daily_study_hours}h/day
                            </span>
                          </div>
                        </div>
                        <span className="font-['Manrope'] font-bold text-lg text-[#cdc0ec]">
                          {progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#252626] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${style.dot}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#acabaa]">
                        <span>{progress.completed} completed</span>
                        <span>{progress.total} total</span>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>

          {/* ── Desktop layout (unchanged) ─────────────── */}
          <div className="hidden md:block">
            <div className="mb-8">
              <div className="bg-[#131313] rounded-xl p-8 border border-[#484848]/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Overall Progress</h3>
                    <p className="text-sm text-[#acabaa] mt-1">
                      {overallProgress.completed} of {overallProgress.total} tasks completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-['Manrope'] font-bold text-[#cdc0ec]">
                      {overallProgress.percentage}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-[#1f2020] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5] mb-4">Course Progress</h3>
              {courses.length === 0 ? (
                <div className="bg-[#131313] rounded-xl p-8 text-center">
                  <p className="text-[#acabaa]">No courses yet. Create a study plan to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => {
                    const progress = calculateCourseProgress(course.id);
                    const plan = plans.get(course.id);
                    const style = getCourseStyle(course.id, courses.map(c => c.id));
                    return (
                      <div key={course.id} className="bg-[#131313] rounded-xl p-6 border border-[#484848]/10 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                            <span className={`text-base font-bold font-['Manrope'] ${style.text}`}>
                              {course.course_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-lg font-medium text-[#e7e5e5]">{course.course_name}</h4>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center gap-4 text-sm text-[#acabaa]">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">event</span>
                              <span>{course.exam_date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              <span>{course.daily_study_hours}h/day</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#acabaa]">Progress</span>
                            <span className={`${style.text} font-semibold`}>{progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-[#1f2020] rounded-full h-2 overflow-hidden">
                            <div
                              className={`${style.dot} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#acabaa] mt-2">
                            <span>{progress.completed} completed</span>
                            <span>{progress.total} total tasks</span>
                          </div>
                        </div>
                        {plan && (
                          <div className="mt-4 pt-4 border-t border-[#484848]/20">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#acabaa]">Study days</span>
                              <span className="text-[#e7e5e5]">{plan.daily_plans.length} days</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="bg-[#131313] rounded-xl p-6 border border-[#484848]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#cdc0ec]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#cdc0ec]">school</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Active Courses</p>
                    <p className="text-2xl font-['Manrope'] font-bold text-[#e7e5e5]">{courses.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#131313] rounded-xl p-6 border border-[#484848]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#8fa1a1]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#8fa1a1]">task_alt</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Tasks Completed</p>
                    <p className="text-2xl font-['Manrope'] font-bold text-[#e7e5e5]">{overallProgress.completed}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#131313] rounded-xl p-6 border border-[#484848]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#edbbb1]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#edbbb1]">local_fire_department</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#acabaa] uppercase tracking-widest">Study Streak</p>
                    <p className="text-2xl font-['Manrope'] font-bold text-[#e7e5e5]">{dashboardStats.day_streak} days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
