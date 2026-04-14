// src/components/CourseCard.tsx
import type { Course } from "../types/course";
import { getCourseStyle } from "../utils/courseStyle";

type CourseCardProps = {
  course: Course;
  allCourseIds?: number[];
  onDelete?: () => void;
  onView?: () => void;
};

export function CourseCard({ course, allCourseIds, onDelete, onView }: CourseCardProps) {
  const style = getCourseStyle(course.id, allCourseIds);
  return (
    <div className={`group relative bg-[#131313] border-2 border-[#2a2a2a] rounded-xl p-6 transition-all duration-300 hover:shadow-lg`}
      style={{ ["--hover-color" as string]: style.hex }}
    >
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, ${style.hex}, ${style.hex}99)` }}
      />

      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center`}>
            <span className={`text-base font-bold font-['Manrope'] ${style.text}`}>
              {course.course_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="text-lg font-['Manrope'] font-semibold text-[#e7e5e5]">
            {course.course_name}
          </h3>
        </div>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-[#acabaa] hover:text-[#ec7c8a] transition-colors"
            aria-label="Delete course"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        ) : null}
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-2 text-sm text-[#acabaa]">
          <span className="material-symbols-outlined text-base text-[#8fa1a1]">event</span>
          <span>Exam: {course.exam_date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#acabaa]">
          <span className="material-symbols-outlined text-base text-[#8fa1a1]">schedule</span>
          <span>{course.daily_study_hours}h per day</span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#484848]/20">
        <button
          type="button"
          onClick={onView}
          className={`w-full px-4 py-2 ${style.bg} ${style.text} rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-80`}
        >
          <span>View Plan</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}