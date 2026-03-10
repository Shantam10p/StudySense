export type PlannerStudyTask = {
  title: string;
  duration_minutes: number;
  task_type: string;
};

export type PlannerDailyPlan = {
  day: string;
  tasks: PlannerStudyTask[];
};

export type PlannerGenerateRequest = {
  course_name: string;
  exam_date: string;
  topics: string[];
  daily_study_hours: number;
  textbook?: string;
};

export type PlannerGenerateResponse = {
  course_name: string;
  exam_date: string;
  daily_plans: PlannerDailyPlan[];
};
