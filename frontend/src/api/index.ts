// src/api/index.ts
import type { Course } from "../types/course";

const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPI dev server

export async function fetchCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses`);

  if (!response.ok) {
    throw new Error(`Failed to fetch courses (status ${response.status})`);
  }

  return response.json();
}

export async function deleteCourse(courseId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete course (status ${response.status})`);
  }
}