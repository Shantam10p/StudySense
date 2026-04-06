export type PlannerStudyTask = {
  id: number;
  title: string;
  duration_minutes: number;
  task_type: string;
  position: number;
};

export type PlannerDailyPlan = {
  id: number;
  day: string;
  tasks: PlannerStudyTask[];
};

export type PlannerUnscheduledTask = {
  title: string;
  duration_minutes: number;
  task_type: string;
  topic: string;
};

export type PlannerGenerateRequest = {
  course_name: string;
  exam_date: string;
  topics: string[];
  daily_study_hours: number;
  textbook?: string;
};

export type PlannerGenerateResponse = {
  course_id: number;
  course_name: string;
  exam_date: string;
  daily_plans: PlannerDailyPlan[];
  unscheduled?: PlannerUnscheduledTask[];
  warning?: string | null;
};
