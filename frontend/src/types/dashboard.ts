export type SessionStatus = "completed" | "active" | "upcoming";

export type StudySession = {
  id: number;
  course_name: string;
  title: string;
  session_number: number;
  total_sessions: number;
  duration_minutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  status: SessionStatus;
  scheduled_time?: string;
};

export type DashboardStats = {
  sessions_today: number;
  total_time_minutes: number;
  completed_sessions: number;
  day_streak: number;
};

export type UpcomingSession = {
  id: number;
  course_name: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
};

export type DashboardData = {
  stats: DashboardStats;
  today_sessions: StudySession[];
  upcoming_sessions: UpcomingSession[];
};
