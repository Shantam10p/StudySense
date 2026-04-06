import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourses, fetchCoursePlan } from "../api";
import { Sidebar } from "../components/Sidebar";
import type { Course } from "../types/course";
import type { PlannerGenerateResponse, PlannerStudyTask } from "../types/planner";

type SessionWithCourse = {
  task: PlannerStudyTask;
  courseName: string;
  courseId: number;
  dayIndex: number;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<Map<number, PlannerGenerateResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "Student");
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const coursesData = await fetchCourses();
        setCourses(coursesData);

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
        setError(err?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const getTodaySessions = (): SessionWithCourse[] => {
    const sessions: SessionWithCourse[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    plans.forEach((plan, courseId) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      plan.daily_plans.forEach((dailyPlan, index) => {
        const planDate = new Date(dailyPlan.day);
        const planDateStr = planDate.toISOString().split("T")[0];

        if (planDateStr === todayStr) {
          dailyPlan.tasks.forEach((task) => {
            sessions.push({
              task,
              courseName: course.course_name,
              courseId: course.id,
              dayIndex: index,
            });
          });
        }
      });
    });

    return sessions.sort((a, b) => a.task.position - b.task.position);
  };

  const getUpcomingSessions = (): SessionWithCourse[] => {
    const sessions: SessionWithCourse[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    plans.forEach((plan, courseId) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      plan.daily_plans.forEach((dailyPlan, index) => {
        const planDate = new Date(dailyPlan.day);
        planDate.setHours(0, 0, 0, 0);

        if (planDate > today) {
          dailyPlan.tasks.slice(0, 1).forEach((task) => {
            sessions.push({
              task,
              courseName: course.course_name,
              courseId: course.id,
              dayIndex: index,
            });
          });
        }
      });
    });

    return sessions
      .sort((a, b) => {
        const dateA = plans.get(a.courseId)?.daily_plans[a.dayIndex]?.day || "";
        const dateB = plans.get(b.courseId)?.daily_plans[b.dayIndex]?.day || "";
        return dateA.localeCompare(dateB);
      })
      .slice(0, 3);
  };

  const calculateStats = () => {
    const todaySessions = getTodaySessions();
    const totalTime = todaySessions.reduce((sum, s) => sum + s.task.duration_minutes, 0);

    return {
      sessionsToday: todaySessions.length,
      totalTime,
      completed: 0,
      streak: 12,
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "secondary";
      case "medium":
        return "outline";
      case "hard":
        return "error-dim";
      default:
        return "outline";
    }
  };

  const getDifficultyBadge = () => {
    const difficulties = ["Easy", "Medium", "Hard"];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    return difficulty;
  };

  const getSessionIcon = (index: number) => {
    const icons = ["psychology", "palette", "science", "calculate"];
    return icons[index % icons.length];
  };

  const stats = calculateStats();
  const todaySessions = getTodaySessions();
  const upcomingSessions = getUpcomingSessions();

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <p className="text-[#acabaa]">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl bg-transparent">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <p className="text-[#8fa1a1] font-body text-sm tracking-wide">{getCurrentDate()}</p>
              <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
                {getGreeting()}, {userName}. <br />
                <span className="text-[#e7e5e5]">
                  You have {stats.sessionsToday} {stats.sessionsToday === 1 ? "session" : "sessions"} today.
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center bg-[#1f2020] rounded-full px-4 py-2 text-[#acabaa]">
                <span className="material-symbols-outlined mr-2 text-sm">search</span>
                <input
                  className="bg-transparent border-none outline-none text-sm w-48 focus:ring-0 placeholder:text-[#767575]"
                  placeholder="Search knowledge..."
                  type="text"
                />
              </div>
              <span className="material-symbols-outlined text-[#acabaa] hover:text-[#cdc0ec] cursor-pointer transition-colors">
                notifications
              </span>
              <span className="material-symbols-outlined text-[#acabaa] hover:text-[#cdc0ec] cursor-pointer transition-colors">
                settings
              </span>
              <div className="w-10 h-10 rounded-full bg-[#252626] overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-[#cdc0ec]">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <section className="grid grid-cols-4 gap-4">
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-none">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Sessions Today</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">{stats.sessionsToday}</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-none">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Total Time</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">
                  {stats.totalTime}
                  <span className="text-sm font-normal ml-1 text-[#acabaa]">m</span>
                </p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-none">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Completed</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#8fa1a1]">{stats.completed}</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-none">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Day Streak</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#edbbb1]">{stats.streak}</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Today's Study Plan</h3>
              {error && <p className="text-sm text-[#ec7c8a]">{error}</p>}
              {todaySessions.length === 0 ? (
                <div className="bg-[#131313] rounded-xl p-8 text-center">
                  <p className="text-[#acabaa]">No sessions scheduled for today.</p>
                  <button
                    onClick={() => navigate("/planner/new")}
                    className="mt-4 px-6 py-2 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-semibold rounded-lg transition-all hover:scale-[1.02]"
                  >
                    Create Study Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySessions.map((session, index) => {
                    const difficulty = getDifficultyBadge();
                    const diffColor = getDifficultyColor(difficulty);
                    const isActive = index === 0;

                    return (
                      <div
                        key={`${session.courseId}-${session.task.id}`}
                        className={`group ${
                          isActive
                            ? "bg-[#1f2020] shadow-xl shadow-black/20"
                            : "bg-[#131313] hover:bg-[#191a1a]"
                        } rounded-xl p-6 transition-all duration-500 flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={`w-12 h-12 rounded-lg ${
                              isActive ? "bg-[#cdc0ec]/10" : "bg-[#8fa1a1]/10"
                            } flex items-center justify-center text-${isActive ? "[#cdc0ec]" : "[#8fa1a1]"}`}
                          >
                            <span className="material-symbols-outlined">{getSessionIcon(index)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isActive ? "bg-[#cdc0ec]" : "bg-[#8fa1a1]"
                                }`}
                              ></span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${
                                  isActive ? "text-[#cdc0ec]" : "text-[#8fa1a1]"
                                }`}
                              >
                                {session.courseName}
                              </span>
                              <span
                                className={`text-[10px] text-[#${diffColor}] px-2 py-0.5 rounded-full border border-[#${diffColor}]/20`}
                              >
                                {difficulty}
                              </span>
                            </div>
                            <h4 className="text-lg font-medium text-[#e7e5e5]">{session.task.title}</h4>
                            <p className="text-sm text-[#acabaa]">
                              {session.task.task_type} • {session.task.duration_minutes}m
                            </p>
                          </div>
                        </div>
                        {isActive ? (
                          <button
                            onClick={() =>
                              navigate("/study-mode", {
                                state: {
                                  courseId: session.courseId,
                                  courseName: session.courseName,
                                  task: session.task,
                                  dayIndex: session.dayIndex,
                                },
                              })
                            }
                            className="bg-[#cdc0ec] text-[#443b5f] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
                          >
                            Start Session
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/planner/${session.courseId}`)}
                            className="text-[#cdc0ec] hover:bg-[#0e0e0e] px-6 py-2 rounded-lg font-semibold text-sm transition-all"
                          >
                            View Plan
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-[#4b4166]/40 backdrop-blur-md p-6 rounded-xl border-none shadow-lg text-[#dbcefb] relative overflow-hidden">
              <p className="text-sm font-medium leading-relaxed">
                "Focus is the art of saying no to the noise. You're {stats.completed > 0 ? "making progress" : "ready to start"}, {userName}."
              </p>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
            </div>

            <div className="bg-[#131313] rounded-xl p-6 border-none">
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#acabaa] mb-6">Upcoming Schedule</h4>
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-[#acabaa]">No upcoming sessions</p>
              ) : (
                <div className="space-y-6">
                  {upcomingSessions.map((session, index) => {
                    const plan = plans.get(session.courseId);
                    const dayStr = plan?.daily_plans[session.dayIndex]?.day || "";
                    const date = new Date(dayStr);
                    const dayLabel =
                      index === 0 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "long" });
                    const colors = ["[#cdc0ec]", "[#8fa1a1]", "[#edbbb1]"];
                    const color = colors[index % colors.length];

                    return (
                      <div key={`${session.courseId}-${session.dayIndex}`} className="relative pl-6 border-l border-[#484848]/30">
                        <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-${color}`}></div>
                        <p className={`text-[10px] font-bold text-${color} uppercase mb-1`}>{dayLabel}</p>
                        <h5 className="text-sm font-medium text-[#e7e5e5]">{session.task.title}</h5>
                        <p className="text-xs text-[#acabaa] mt-1">
                          {session.courseName} • {session.task.duration_minutes}m
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => navigate("/courses")}
                className="w-full mt-8 text-xs font-semibold text-[#cdc0ec] py-3 rounded-lg border border-[#cdc0ec]/20 hover:bg-[#cdc0ec]/5 transition-colors"
              >
                View All Courses
              </button>
            </div>

          </div>
        </div>
      </main>

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E')",
        }}
      ></div>
    </div>
  );
}
