import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types/course";
import { deleteCourse, fetchCourses } from "../api";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { Loader } from "../components/Loader";
import { CourseCard } from "../components/CourseCard";
import { ConfirmModal } from "../components/ConfirmModal";
import { useSidebar } from "../context/SidebarContext";
import { getCourseStyle } from "../utils/courseStyle";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { toggle } = useSidebar();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchCourses();
        setCourses(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">

        {/* ── Mobile top bar ─────────────────────────── */}
        <header className="flex md:hidden items-center gap-3 px-4 pt-4 pb-3 sticky top-0 bg-[#0e0e0e] z-30">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-[#4b4166] flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[#cdc0ec] text-xl">menu</span>
          </button>
          <span className="font-['Manrope'] font-bold text-xl text-[#cdc0ec]">My Courses</span>
        </header>

        {/* ── Desktop header ──────────────────────────── */}
        <div className="hidden md:flex px-12 pt-12 pb-8 max-w-screen-2xl justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase mb-2">My Learning</span>
            <h2 className="font-['Manrope'] text-[3.5rem] leading-tight font-light text-[#cdc0ec]">My Courses</h2>
          </div>
          <button
            onClick={() => navigate("/planner/new")}
            className="px-6 py-3 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-semibold rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#cdc0ec]/10"
          >
            <span className="material-symbols-outlined">add</span>
            New Plan
          </button>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        <div className="px-4 md:px-12">
          {deleteError && <p className="mb-4 text-sm text-[#ec7c8a]">{deleteError}</p>}

          {loading && (
            <div className="fixed inset-0 md:ml-64 flex items-center justify-center">
              <Loader message="Loading courses..." size="lg" />
            </div>
          )}

          {!loading && error && <p className="text-sm text-[#ec7c8a]">{error}</p>}

          {!loading && !error && courses.length === 0 && (
            <div className="bg-[#131313] rounded-xl border-2 border-[#2a2a2a] px-8 md:px-12 py-12 md:py-16 flex flex-col items-center text-center max-w-3xl mx-auto mt-4">
              <div className="w-16 md:w-20 h-16 md:h-20 rounded-2xl bg-[#cdc0ec]/10 flex items-center justify-center mb-6 md:mb-8">
                <span className="material-symbols-outlined text-[#cdc0ec] text-4xl md:text-5xl">school</span>
              </div>
              <h3 className="font-['Manrope'] text-2xl md:text-3xl font-light text-[#e7e5e5] mb-3">
                No courses yet
              </h3>
              <p className="text-sm md:text-base text-[#acabaa] max-w-lg mb-8 md:mb-10 leading-relaxed">
                Create your first course and generate a study plan to start tracking your progress.
              </p>
              <button
                onClick={() => navigate("/planner/new")}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-bold rounded-lg text-sm md:text-base transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Create Study Plan
              </button>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <>
              {/* Desktop: grid cards */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    allCourseIds={courses.map(c => c.id)}
                    onDelete={() => setDeletingId(course.id)}
                    onView={() => navigate(`/planner/${course.id}`)}
                  />
                ))}
              </div>

              {/* Mobile: stacked cards with left accent strip */}
              <div className="md:hidden space-y-4 mt-2 mb-6">
                {courses.map((course) => {
                  const style = getCourseStyle(course.id, courses.map(c => c.id));
                  return (
                    <div
                      key={course.id}
                      className="relative bg-[#131313] rounded-xl overflow-hidden border border-[#2a2a2a] flex"
                    >
                      {/* Left accent strip */}
                      <div className="w-1 shrink-0" style={{ background: style.hex }} />

                      <div className="flex-1 p-4">
                        {/* Course name + delete */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-['Manrope'] font-bold text-base text-[#e7e5e5] leading-snug">
                            {course.course_name}
                          </h3>
                          <button
                            onClick={() => setDeletingId(course.id)}
                            className="text-[#acabaa] hover:text-[#ec7c8a] transition-colors shrink-0 mt-0.5"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-[#acabaa] mb-4">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-[#8fa1a1]">event</span>
                            {course.exam_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-[#8fa1a1]">schedule</span>
                            {course.daily_study_hours}h/day
                          </span>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => navigate(`/planner/${course.id}`)}
                          className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${style.bg} ${style.text}`}
                        >
                          View Plan
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile FAB — new plan */}
      <button
        onClick={() => navigate("/planner/new")}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] shadow-[0_8px_24px_rgba(205,192,236,0.25)] flex items-center justify-center transition-transform active:scale-90 z-40"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      <BottomNav />

      {deletingId !== null && (
        <ConfirmModal
          title="Delete course?"
          message="This will permanently remove this course."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          loading={isDeleting}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            if (deletingId === null || isDeleting) return;
            setIsDeleting(true);
            try {
              setDeleteError(null);
              await deleteCourse(deletingId);
              setCourses((prev) => prev.filter((c) => c.id !== deletingId));
            } catch (err: any) {
              setDeleteError(err?.message || "Failed to delete course");
            } finally {
              setDeletingId(null);
              setIsDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}
