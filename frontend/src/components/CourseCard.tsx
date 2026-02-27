// src/components/CourseCard.tsx
import type { Course } from "../types/course";

type CourseCardProps = {
  course: Course;
  onDelete?: () => void;
};

export function CourseCard({ course, onDelete }: CourseCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          {course.course_name}
        </h3>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-slate-400 hover:text-red-600"
            aria-label="Delete course"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.5 3.5A1.5 1.5 0 0 1 9 2h2a1.5 1.5 0 0 1 1.5 1.5V4H15a.75.75 0 0 1 0 1.5h-.44l-.62 9.316A1.75 1.75 0 0 1 12.2 16.5H7.8a1.75 1.75 0 0 1-1.74-1.684L5.44 5.5H5A.75.75 0 0 1 5 4h2.5v-.5Zm1.5.5h2V3.5a.5.5 0 0 0-.5-.5H9a.5.5 0 0 0-.5.5V4Zm-.97 3.25a.75.75 0 0 1 .8.7l.25 5.5a.75.75 0 1 1-1.5.07l-.25-5.5a.75.75 0 0 1 .7-.77Zm4.44.7a.75.75 0 0 0-1.5-.07l-.25 5.5a.75.75 0 0 0 1.5.07l.25-5.5Z" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6 2.75a.75.75 0 0 0-1.5 0V4H3.5A1.5 1.5 0 0 0 2 5.5v10A1.5 1.5 0 0 0 3.5 17h13a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 16.5 4H15V2.75a.75.75 0 0 0-1.5 0V4H6V2.75ZM3.5 7H16.5v8.5a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V7Z" />
          </svg>
          <span className="ml-2">{course.exam_date}</span>
        </div>
        <div className="flex items-center">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12a.75.75 0 1 0-1.5 0v4.19l-2.22 2.22a.75.75 0 1 0 1.06 1.06l2.41-2.41A1.5 1.5 0 0 0 12 9.5V6Z" clipRule="evenodd" />
          </svg>
          <span className="ml-2">{course.daily_study_hours}h/day</span>
        </div>
      </div>

      <div className="mt-4">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View
        </button>
      </div>
    </div>
  );
}