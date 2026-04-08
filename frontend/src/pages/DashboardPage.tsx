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
  const [sessionView, setSessionView] = useState<"today" | "previous" | "upcoming">("today");
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);

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

  const getPreviousSessions = (): SessionWithCourse[] => {
    const sessions: SessionWithCourse[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    plans.forEach((plan, courseId) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      plan.daily_plans.forEach((dailyPlan, index) => {
        const planDate = new Date(dailyPlan.day);
        planDate.setHours(0, 0, 0, 0);

        if (planDate < today) {
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

    return sessions
    
      .sort((a, b) => {
        const dateA = plans.get(a.courseId)?.daily_plans[a.dayIndex]?.day || "";
        const dateB = plans.get(b.courseId)?.daily_plans[b.dayIndex]?.day || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 10);
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

    return sessions
      .sort((a, b) => {
        const dateA = plans.get(a.courseId)?.daily_plans[a.dayIndex]?.day || "";
        const dateB = plans.get(b.courseId)?.daily_plans[b.dayIndex]?.day || "";
        return dateA.localeCompare(dateB);
      })
      .slice(0, 10);
  };

  const calculateStats = () => {
    const todaySessions = getTodaySessions();
    const previousSessions = getPreviousSessions();
    const upcomingSessions = getUpcomingSessions();
    const totalTime = todaySessions.reduce((sum, s) => sum + s.task.duration_minutes, 0);
    const previousTotalTime = previousSessions.reduce((sum, s) => sum + s.task.duration_minutes, 0);
    const upcomingTotalTime = upcomingSessions.reduce((sum, s) => sum + s.task.duration_minutes, 0);

    return {
      sessionsToday: todaySessions.length,
      totalTime,
      previousSessions: previousSessions.length,
      previousTotalTime,
      upcomingSessions: upcomingSessions.length,
      upcomingTotalTime,
      completed: 0,
      streak: 12,
    };
  };


  const getSessionIcon = (index: number) => {
    const icons = ["psychology", "palette", "science", "calculate"];
    return icons[index % icons.length];
  };

  const getSessionDate = (session: SessionWithCourse) => {
    const plan = plans.get(session.courseId);
    if (!plan) return "";
    const dayStr = plan.daily_plans[session.dayIndex]?.day;
    if (!dayStr) return "";
    
    const date = new Date(dayStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    const diffTime = sessionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const hasSavedSessionState = (session: SessionWithCourse) => {
    try {
      const storageKey = `study_timer:${session.courseId}:${session.dayIndex}:${session.task.id}`;
      return window.localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  };

  const stats = calculateStats();
  const todaySessions = getTodaySessions();
  const previousSessions = getPreviousSessions();
  const upcomingSessions = getUpcomingSessions();

  const displayedSessions = sessionView === "today" 
    ? todaySessions 
    : sessionView === "previous" 
    ? previousSessions 
    : upcomingSessions;

  const sessionViewLabel =
    sessionView === "today" ? "Today" : sessionView === "previous" ? "Previous" : "Upcoming";

  const sessionCountLabel =
    sessionView === "today" ? "Sessions Today" : sessionView === "previous" ? "Previous Sessions" : "Upcoming Sessions";

  const sessionCountValue =
    sessionView === "today"
      ? stats.sessionsToday
      : sessionView === "previous"
      ? stats.previousSessions
      : stats.upcomingSessions;

  const sessionTimeValue =
    sessionView === "today"
      ? stats.totalTime
      : sessionView === "previous"
      ? stats.previousTotalTime
      : stats.upcomingTotalTime;

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
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#1f2020] rounded-full px-4 py-2 text-[#acabaa]">
                <span className="material-symbols-outlined mr-2 text-sm">search</span>
                <input
                  className="bg-transparent border-none outline-none text-sm w-48 focus:ring-0 placeholder:text-[#767575]"
                  placeholder="Search session..."
                  type="text"
                />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#252626] overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#2d2e2e] transition-colors">
                <span className="material-symbols-outlined text-[#cdc0ec] text-2xl">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <section className="grid grid-cols-4 gap-4">
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">{sessionCountLabel}</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">{sessionCountValue}</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Total Time</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">
                  {sessionTimeValue}
                  <span className="text-sm font-normal ml-1 text-[#acabaa]">m</span>
                </p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Completed</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#8fa1a1]">{stats.completed}</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Day Streak</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#edbbb1]">{stats.streak}</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-['Manrope'] font-semibold text-[#e7e5e5]">Study Sessions</h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSessionMenuOpen((current) => !current)}
                    className="min-w-[152px] bg-[#131313] border-2 border-[#2a2a2a] text-[#e7e5e5] pl-4 pr-10 py-2.5 rounded-lg text-sm font-medium text-left transition-colors hover:border-[#cdc0ec]/40"
                  >
                    {sessionViewLabel}
                  </button>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#acabaa] pointer-events-none text-lg">
                    {isSessionMenuOpen ? "expand_less" : "expand_more"}
                  </span>

                  {isSessionMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[152px] overflow-hidden rounded-lg border-2 border-[#2a2a2a] bg-[#131313] shadow-xl shadow-black/30">
                      {[
                        { value: "today", label: "Today" },
                        { value: "previous", label: "Previous" },
                        { value: "upcoming", label: "Upcoming" },
                      ].map((option) => {
                        const isSelected = sessionView === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSessionView(option.value as "today" | "previous" | "upcoming");
                              setIsSessionMenuOpen(false);
                            }}
                            className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-[#cdc0ec] text-[#443b5f]"
                                : "text-[#e7e5e5] hover:bg-[#1c1c1c]"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              {error && <p className="text-sm text-[#ec7c8a]">{error}</p>}
              {displayedSessions.length === 0 ? (
                <div className="bg-[#131313] rounded-xl p-8 text-center border-2 border-[#2a2a2a]">
                  <p className="text-[#acabaa]">
                    {sessionView === "today" && "No sessions scheduled for today."}
                    {sessionView === "previous" && "No previous sessions found."}
                    {sessionView === "upcoming" && "No upcoming sessions found."}
                  </p>
                  <button
                    onClick={() => navigate("/planner/new")}
                    className="mt-4 px-6 py-2 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-semibold rounded-lg transition-all hover:scale-[1.02]"
                  >
                    Create Study Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedSessions.map((session, index) => {
                    const isActive = index === 0;
                    const hasStartedSession = hasSavedSessionState(session);
                    const sessionDate = getSessionDate(session);
                    const showDate = sessionView !== "today";

                    return (
                      <div
                        key={`${session.courseId}-${session.task.id}`}
                        className="group bg-[#1f2020] shadow-xl shadow-black/20 border-2 border-[#3a3a3a] rounded-xl p-6 transition-all duration-500 flex items-center justify-between"
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
                            </div>
                            <h4 className="text-lg font-medium text-[#e7e5e5]">{session.task.title}</h4>
                            <p className="text-sm text-[#acabaa]">
                              {session.task.task_type} • {session.task.duration_minutes}m
                              {showDate && sessionDate && (
                                <>
                                  {" • "}
                                  <span className="text-[#8fa1a1] font-medium">{sessionDate}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
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
                          {hasStartedSession ? "Continue Session" : "Start Session"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-[#4b4166]/40 backdrop-blur-md p-6 rounded-xl border-2 border-[#5a4d7a] shadow-lg text-[#dbcefb] relative overflow-hidden">
              <p className="text-sm font-medium leading-relaxed">
                "Focus is the art of saying no to the noise. You're {stats.completed > 0 ? "making progress" : "ready to start"}, {userName}."
              </p>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <span className="material-symbols-outlined text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
            </div>

            <div className="bg-[#131313] rounded-xl p-6 border-2 border-[#2a2a2a]">
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
