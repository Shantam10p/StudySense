export type Course = {
  id: number;
  course_name: string;
  exam_date: string;          // ISO date string (YYYY-MM-DD)
  daily_study_hours: number;
  created_at: string;         // ISO timestamp
};