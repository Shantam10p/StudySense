// src/components/CourseCard.tsx
import type { Course } from "../types/course";

type CourseCardProps = {
  course: Course;
  onDelete?: () => void;
  onView?: () => void;
};

export function CourseCard({ course, onDelete, onView }: CourseCardProps) {
  return (
    <div className="group relative bg-[#131313] border-2 border-[#2a2a2a] rounded-xl p-6 hover:border-[#cdc0ec]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#cdc0ec]/5">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4b4166]/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#cdc0ec] text-xl">school</span>
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
          className="w-full px-4 py-2 bg-[#4b4166]/20 hover:bg-[#4b4166]/40 text-[#cdc0ec] rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-gradient-to-r group-hover:from-[#cdc0ec] group-hover:to-[#bfb2de] group-hover:text-[#443b5f]"
        >
          <span>View Plan</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}