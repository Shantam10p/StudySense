from app.db.database import get_connection
from app.schemas.course import CoursePutRequest


class CourseService:
    def __init__(self) -> None:
        return

    def get_courses(self) -> list[dict]:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM courses ORDER BY created_at DESC, id DESC")
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    def get_course(self, course_id: int) -> dict | None:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

    def delete_course(self, course_id: int) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM courses WHERE id = %s", (course_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def update_course(self, course_id: int, payload: CoursePutRequest) -> dict | None:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                UPDATE courses
                SET course_name = %s, exam_date = %s, daily_study_hours = %s
                WHERE id = %s
                """,
                (
                    payload.course_name,
                    payload.exam_date,
                    payload.daily_study_hours,
                    course_id,
                ),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return None
        finally:
            cursor.close()
            conn.close()

        return self.get_course(course_id)
