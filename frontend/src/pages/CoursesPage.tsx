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

  if (loading) {
    return <p>Loading courses...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (courses.length === 0) {
    return <p>No courses yet.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E0E7FF]">
      <TopBar onNewPlan={() => navigate("/planner")} />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 border-b-2 border-blue-300 pb-2 inline-block">
          Courses
        </h1>
        {deleteError ? (
          <p className="mb-4 text-sm text-red-600">{deleteError}</p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={() => setDeletingId(course.id)}
            />
          ))}
        </div>
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