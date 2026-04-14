import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourses, fetchCoursePlan, fetchDashboardStats, fetchSenseiContent, completeStudyTask, reopenStudyTask } from "../api";
import { Sidebar } from "../components/Sidebar";
import { Loader } from "../components/Loader";
import type { Course } from "../types/course";
import type { PlannerGenerateResponse, PlannerStudyTask } from "../types/planner";
import type { SenseiContentResponse } from "../types/sensei";

const LOADING_MESSAGES = [
  "Sensei is reading your topic...",
  "Identifying key concepts...",
  "Preparing practice questions...",
  "Putting it all together...",
];

function deriveTopicFromTitle(title: string) {
  return title
    .replace(/^(Study|Continue|Revisit|Review)\s+/i, "")
    .replace(/\s+using\s+.+$/i, "")
    .trim();
}

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
  const [dashboardStats, setDashboardStats] = useState({ completed_sessions: 0, day_streak: 0, completed_task_ids: [] as number[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Student");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionView, setSessionView] = useState<"today" | "previous" | "upcoming">("today");
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const [senseiLoadingTaskId, setSenseiLoadingTaskId] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);

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

  // fake progress bar while sensei loads
  useEffect(() => {
    if (senseiLoadingTaskId === null) return;
    setLoadingProgress(0);
    setLoadingMessageIdx(0);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 85) { clearInterval(interval); return 85; }
        return prev + 3;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [senseiLoadingTaskId]);

  // rotate loading messages
  useEffect(() => {
    if (senseiLoadingTaskId === null) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [senseiLoadingTaskId]);

  const PENDING_SESSION_KEY = "sensei_pending_session";

  const handleStartSession = async (session: SessionWithCourse) => {
    const topic = deriveTopicFromTitle(session.task.title);
    setSenseiLoadingTaskId(session.task.id);
    sessionStorage.setItem(PENDING_SESSION_KEY, JSON.stringify(session));

    let senseiContent: SenseiContentResponse | undefined;
    try {
      senseiContent = await fetchSenseiContent({
        topic,
        course_name: session.courseName,
        course_id: session.courseId,
      });
    } catch {
      // if fetch fails, navigate anyway — StudyModePage will retry
    }

    setLoadingProgress(100);
    await new Promise((r) => setTimeout(r, 300));
    setSenseiLoadingTaskId(null);
    sessionStorage.removeItem(PENDING_SESSION_KEY);

    navigate("/study-mode", {
      state: {
        courseId: session.courseId,
        courseName: session.courseName,
        task: session.task,
        dayIndex: session.dayIndex,
        senseiContent,
      },
    });
  };

  // restore loading state if user navigated away mid-load
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_SESSION_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as SessionWithCourse;
      handleStartSession(pending);
    } catch {
      sessionStorage.removeItem(PENDING_SESSION_KEY);
    }
  }, []);

  const handleToggleComplete = async (taskId: number, isCompleted: boolean) => {
    setTogglingTaskId(taskId);
    // optimistic update
    setDashboardStats((prev) => ({
      ...prev,
      completed_task_ids: isCompleted
        ? prev.completed_task_ids.filter((id) => id !== taskId)
        : [...prev.completed_task_ids, taskId],
      completed_sessions: isCompleted
        ? Math.max(0, prev.completed_sessions - 1)
        : prev.completed_sessions + 1,
    }));
    try {
      if (isCompleted) {
        await reopenStudyTask(taskId);
      } else {
        await completeStudyTask(taskId);
      }
    } catch {
      // rollback on failure
      setDashboardStats((prev) => ({
        ...prev,
        completed_task_ids: isCompleted
          ? [...prev.completed_task_ids, taskId]
          : prev.completed_task_ids.filter((id) => id !== taskId),
        completed_sessions: isCompleted
          ? prev.completed_sessions + 1
          : Math.max(0, prev.completed_sessions - 1),
      }));
    } finally {
      setTogglingTaskId(null);
    }
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
      completed: dashboardStats.completed_sessions,
      streak: dashboardStats.day_streak,
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredSessions = displayedSessions.filter((session) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const searchableText = [session.task.title, session.courseName, session.task.task_type]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchQuery);
  });

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
          <Loader message="Loading dashboard..." size="lg" />
        </main>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#0e0e0e]">
        <Sidebar />
        <main className="ml-64 flex-1 flex flex-col">
          <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl bg-transparent">
            <div className="space-y-2">
              <p className="text-[#8fa1a1] font-body text-sm tracking-wide">{getCurrentDate()}</p>
              <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
                {getGreeting()}, {userName}.
              </h2>
            </div>
          </header>

          <div className="px-12 pb-8 max-w-screen-2xl space-y-6">
            <section className="grid grid-cols-4 gap-4">
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Sessions Today</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">0</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Total Time</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#cdc0ec]">0<span className="text-sm font-normal ml-1 text-[#acabaa]">m</span></p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Completed</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#8fa1a1]">0</p>
              </div>
              <div className="bg-[#131313] p-6 rounded-xl space-y-2 border-2 border-[#2a2a2a]">
                <p className="text-[#acabaa] text-xs font-medium uppercase tracking-widest">Day Streak</p>
                <p className="text-3xl font-['Manrope'] font-bold text-[#7fd29a]">0</p>
              </div>
            </section>

            <section className="bg-[#131313] rounded-xl border-2 border-[#2a2a2a] px-12 py-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#cdc0ec]/10 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-[#cdc0ec] text-5xl">auto_stories</span>
              </div>
              <h3 className="font-['Manrope'] text-3xl font-light text-[#e7e5e5] mb-3">
                Start your study journey
              </h3>
              <p className="text-base text-[#acabaa] max-w-lg mb-10 leading-relaxed">
                Create a course and generate a personalized study plan. Your sessions, progress, and streaks will appear here.
              </p>
              <button
                onClick={() => navigate("/planner/new")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-bold rounded-lg text-base transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Create Study Plan
              </button>
            </section>
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
            <div className="relative -top-4 flex items-center gap-4">
              <div className="flex items-center bg-[#1f2020] rounded-full px-4 py-2 text-[#acabaa]">
                <span className="material-symbols-outlined mr-2 text-sm">search</span>
                <input
                  className="bg-transparent border-none outline-none text-sm w-48 focus:ring-0 placeholder:text-[#767575]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                <p className="text-3xl font-['Manrope'] font-bold text-[#7fd29a]">{stats.streak}</p>
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
              {filteredSessions.length === 0 ? (
                <div className="bg-[#131313] rounded-xl p-8 text-center border-2 border-[#2a2a2a]">
                  <p className="text-[#acabaa]">
                    {normalizedSearchQuery
                      ? `No sessions found for "${searchQuery.trim()}".`
                      : sessionView === "today"
                      ? "No sessions scheduled for today."
                      : sessionView === "previous"
                      ? "No previous sessions found."
                      : "No upcoming sessions found."}
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
                  {filteredSessions.map((session, index) => {
                    const isActive = index === 0;
                    const hasStartedSession = hasSavedSessionState(session);
                    const isCompleted = dashboardStats.completed_task_ids.includes(session.task.id);
                    const sessionDate = getSessionDate(session);
                    const showDate = sessionView !== "today";

                    const isLoading = senseiLoadingTaskId === session.task.id;

                    return (
                      <div
                        key={`${session.courseId}-${session.task.id}`}
                        className={`relative overflow-hidden bg-[#1f2020] shadow-xl shadow-black/20 border-2 rounded-xl py-6 px-6 transition-all duration-500 flex items-center justify-between ${
                          isLoading
                            ? "border-[#cdc0ec]/40 bg-[#1a1726]"
                            : "border-[#3a3a3a]"
                        }`}
                      >

                        {/* Left: icon + info */}
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
                              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-[#cdc0ec]" : "bg-[#8fa1a1]"}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-[#cdc0ec]" : "text-[#8fa1a1]"}`}>
                                {session.courseName}
                              </span>
                            </div>
                            <h4 className="text-lg font-medium text-[#e7e5e5]">{session.task.title}</h4>
                            <p className="text-sm text-[#acabaa]">
                              {session.task.task_type} • {session.task.duration_minutes}m
                              {showDate && sessionDate && (
                                <>{" • "}<span className="text-[#8fa1a1] font-medium">{sessionDate}</span></>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Secondary action: absolute top-right */}
                        {!isLoading && (
                          isCompleted ? (
                            <button
                              onClick={() => handleToggleComplete(session.task.id, true)}
                              disabled={togglingTaskId === session.task.id}
                              className="absolute top-3 right-6 flex items-center gap-1 text-[10px] font-medium text-[#767575] hover:text-[#e8956d] transition-colors disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                              Reopen session
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleComplete(session.task.id, false)}
                              disabled={togglingTaskId === session.task.id || senseiLoadingTaskId !== null}
                              className="absolute top-3 right-6 flex items-center gap-1 text-[10px] font-medium text-[#767575] hover:text-[#6dbf8a] transition-colors disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              Mark as completed
                            </button>
                          )
                        )}

                        {/* Right: primary action — slightly below center */}
                        <div className="shrink-0 mt-4">
                          {isLoading ? (
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2 rounded-lg bg-[#4b4166]/30 px-4 py-2">
                                <span className="flex items-center gap-[3px]">
                                  {[0, 1, 2].map((i) => (
                                    <span
                                      key={i}
                                      className="h-[5px] w-[5px] rounded-full bg-[#cdc0ec] animate-bounce"
                                      style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                  ))}
                                </span>
                                <span className="text-xs font-medium text-[#cdc0ec]">Preparing</span>
                              </div>
                              <p className="text-[11px] font-semibold text-[#9b8ec4] transition-all duration-500">
                                {LOADING_MESSAGES[loadingMessageIdx]}
                              </p>
                            </div>
                          ) : isCompleted ? (
                            <span className="flex items-center gap-1.5 rounded-lg border border-[#3a3a3a] bg-[#131313] px-4 py-2 text-sm font-semibold text-[#8e8d8d]">
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartSession(session)}
                              disabled={senseiLoadingTaskId !== null}
                              className="bg-[#cdc0ec] text-[#443b5f] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {hasStartedSession ? "Continue Session" : "Start Session"}
                            </button>
                          )}
                        </div>

                        {/* progress bar */}
                        {isLoading && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2a2a2a]">
                            <div
                              className="h-full bg-gradient-to-r from-[#cdc0ec]/50 to-[#cdc0ec] transition-all duration-300 ease-out"
                              style={{ width: `${loadingProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-[#352d49]/55 backdrop-blur-md p-6 rounded-xl border-2 border-[#47395f] shadow-lg text-[#c9bbeb] relative overflow-hidden">
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
                (() => {
                  // Group by day to assign consistent colors
                  const colorOptions = [
                    { bg: "bg-[#cdc0ec]", text: "text-[#cdc0ec]" },
                    { bg: "bg-[#8fa1a1]", text: "text-[#8fa1a1]" },
                    { bg: "bg-[#edbbb1]", text: "text-[#edbbb1]" },
                  ];
                  
                  const uniqueDays = [...new Set(upcomingSessions.map(s => {
                    const p = plans.get(s.courseId);
                    return p?.daily_plans[s.dayIndex]?.day || "";
                  }))];
                  
                  const dayColors: Record<string, { bg: string; text: string }> = {};
                  uniqueDays.forEach((day, idx) => {
                    dayColors[day] = colorOptions[idx % colorOptions.length];
                  });

                  return (
                    <div className="space-y-6">
                      {upcomingSessions.map((session) => {
                        const plan = plans.get(session.courseId);
                        const dayStr = plan?.daily_plans[session.dayIndex]?.day || "";
                        const dayLabel = getSessionDate(session);
                        const { bg, text } = dayColors[dayStr] || colorOptions[0];

                        return (
                          <div key={`${session.courseId}-${session.dayIndex}-${session.task.id}`} className="relative pl-6 border-l border-[#484848]/30">
                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${bg}`}></div>
                            <p className={`text-[10px] font-bold ${text} uppercase mb-1`}>{dayLabel}</p>
                            <h5 className="text-sm font-medium text-[#e7e5e5]">{session.task.title}</h5>
                            <p className="text-xs text-[#acabaa] mt-1">
                              {session.courseName} • {session.task.duration_minutes}m
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
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
