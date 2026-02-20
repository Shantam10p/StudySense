// src/pages/CoursesPage.tsx

import { useEffect, useState } from "react";
import type { Course } from "../types/course";
import { fetchCourses } from "../api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div>
      <h1 className="text-3xl font-bold text-blue-800 mb-6 border-b-2 border-blue-300 pb-2 inline-block">Courses</h1>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <strong>{course.course_name}</strong> — Exam: {course.exam_date} —{" "}
            {course.daily_study_hours}h/day
          </li>
        ))}
      </ul>
    </div>
  );
}
