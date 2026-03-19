// src/pages/CoursesPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Course } from "../types/course";

import { deleteCourse, fetchCourses } from "../api";
import { TopBar } from "../components/Topbar";
import { CourseCard } from "../components/CourseCard";
import { ConfirmModal } from "../components/ConfirmModal";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/");
  }

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
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E0E7FF]">
      <TopBar onNewPlan={() => navigate("/planner/new")} onLogout={handleLogout} />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 border-b-2 border-blue-300 pb-2 inline-block">
         Your  Courses
        </h1>

        {deleteError ? (
          <p className="mb-4 text-sm text-red-600">{deleteError}</p>
        ) : null}

        {loading ? <p className="text-slate-600">Loading courses...</p> : null}

        {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && courses.length === 0 ? (
          <p className="text-slate-600">No courses yet.</p>
        ) : null}

        {!loading && !error && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onDelete={() => setDeletingId(course.id)}
                onView={() => navigate(`/planner/${course.id}`)}
              />
            ))}
          </div>
        ) : null}
      </div>
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