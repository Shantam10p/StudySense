import { useEffect, useState } from "react";
import { fetchCourses, fetchCoursePlan, fetchDashboardStats } from "../api";
import { Sidebar } from "../components/Sidebar";
import { Loader } from "../components/Loader";
import type { Course } from "../types/course";
import type { DashboardStats } from "../types/dashboard";
import type { PlannerGenerateResponse } from "../types/planner";

export default function ProgressPage() {
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
      (sum, day) =>
        sum + day.tasks.filter((task) => dashboardStats.completed_task_ids.includes(task.id)).length,
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader message="Loading progress..." size="lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="space-y-2">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">Analytics</span>
            <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
              Your Progress
            </h2>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl">
          {error && <p className="text-sm text-[#ec7c8a] mb-6">{error}</p>}

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
                ></div>
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

                  return (
                    <div
                      key={course.id}
                      className="bg-[#131313] rounded-xl p-6 border border-[#484848]/10 hover:border-[#cdc0ec]/20 transition-all"
                    >
                      <div className="mb-4">
                        <h4 className="text-lg font-medium text-[#e7e5e5] mb-2">{course.course_name}</h4>
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
                          <span className="text-[#cdc0ec] font-semibold">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#1f2020] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
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
      </main>
    </div>
  );
}
