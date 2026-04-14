// src/pages/CoursesPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types/course";

import { deleteCourse, fetchCourses } from "../api";
import { Sidebar } from "../components/Sidebar";
import { Loader } from "../components/Loader";
import { CourseCard } from "../components/CourseCard";
import { ConfirmModal } from "../components/ConfirmModal";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      <main className="flex-1 ml-64 min-h-screen">
        <div className="px-12 pt-12 pb-8 max-w-screen-2xl">
          <div className="flex justify-between items-end mb-8">
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
        </div>

        <div className="px-12">
          {deleteError ? (
            <p className="mb-4 text-sm text-[#ec7c8a]">{deleteError}</p>
          ) : null}

          {loading ? (
            <div className="fixed inset-0 ml-64 flex items-center justify-center">
              <Loader message="Loading courses..." size="lg" />
            </div>
          ) : null}

          {!loading && error ? <p className="text-sm text-[#ec7c8a]">{error}</p> : null}

          {!loading && !error && courses.length === 0 ? (
            <div className="bg-[#131313] rounded-xl border-2 border-[#2a2a2a] px-12 py-16 flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-[#cdc0ec]/10 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-[#cdc0ec] text-5xl">school</span>
              </div>
              <h3 className="font-['Manrope'] text-3xl font-light text-[#e7e5e5] mb-3">
                No courses yet
              </h3>
              <p className="text-base text-[#acabaa] max-w-lg mb-10 leading-relaxed">
                Create your first course and generate a study plan to start tracking your progress.
              </p>
              <button
                onClick={() => navigate("/planner/new")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-bold rounded-lg text-base transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Create Study Plan
              </button>
            </div>
          ) : null}

          {!loading && !error && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
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
          ) : null}
        </div>
      </main>
      {deletingId !== null ? (
        <ConfirmModal
          title="Delete course?"
          message="This will permanently remove this course."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            if (deletingId === null) return;
            try {
              setDeleteError(null);
              await deleteCourse(deletingId);
              setCourses((prev) => prev.filter((c) => c.id !== deletingId));
            } catch (err: any) {
              setDeleteError(err?.message || "Failed to delete course");
            } finally {
              setDeletingId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}