from datetime import date, timedelta

from mysql.connector.errors import ProgrammingError

from app.db.database import get_connection
from app.schemas.study_progress import DashboardStatsResponse, StudyTaskCompletionResponse


class StudyProgressService:
    def complete_task(self, task_id: int, user_id: int) -> StudyTaskCompletionResponse:
        conn = get_connection()
        try:
            if not self._task_belongs_to_user(conn, task_id, user_id):
                raise ValueError("Task not found")

            cursor = conn.cursor()
            try:
                cursor.execute(
                    """
                    INSERT INTO study_task_completions (user_id, study_task_id)
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE completed_at = completed_at
                    """,
                    (user_id, task_id),
                )
                conn.commit()
            finally:
                cursor.close()

            return StudyTaskCompletionResponse(task_id=task_id, completed=True)
        finally:
            conn.close()

    def reopen_task(self, task_id: int, user_id: int) -> StudyTaskCompletionResponse:
        conn = get_connection()
        try:
            if not self._task_belongs_to_user(conn, task_id, user_id):
                raise ValueError("Task not found")

            cursor = conn.cursor()
            try:
                cursor.execute(
                    "DELETE FROM study_task_completions WHERE user_id = %s AND study_task_id = %s",
                    (user_id, task_id),
                )
                conn.commit()
            finally:
                cursor.close()

            return StudyTaskCompletionResponse(task_id=task_id, completed=False)
        finally:
            conn.close()

    def get_dashboard_stats(self, user_id: int) -> DashboardStatsResponse:
        conn = get_connection()
        try:
            try:
                completed_sessions = self._count_completed_sessions(conn, user_id)
                completion_dates = self._fetch_completion_dates(conn, user_id)
                completed_task_ids = self._fetch_completed_task_ids(conn, user_id)
                day_streak = self._calculate_day_streak(completion_dates)
            except ProgrammingError as exc:
                if not self._is_missing_completions_table_error(exc):
                    raise
                completed_sessions = 0
                day_streak = 0
                completed_task_ids = []
            return DashboardStatsResponse(
                completed_sessions=completed_sessions,
                day_streak=day_streak,
                completed_task_ids=completed_task_ids,
            )
        finally:
            conn.close()

    def _is_missing_completions_table_error(self, exc: ProgrammingError) -> bool:
        return getattr(exc, "errno", None) == 1146 and "study_task_completions" in str(exc)

    def _task_belongs_to_user(self, conn, task_id: int, user_id: int) -> bool:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT st.id
                FROM study_tasks st
                INNER JOIN daily_plans dp ON dp.id = st.daily_plan_id
                INNER JOIN courses c ON c.id = dp.course_id
                WHERE st.id = %s AND c.user_id = %s
                LIMIT 1
                """,
                (task_id, user_id),
            )
            return cursor.fetchone() is not None
        finally:
            cursor.close()

    def _count_completed_sessions(self, conn, user_id: int) -> int:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT COUNT(*) AS completed_sessions FROM study_task_completions WHERE user_id = %s",
                (user_id,),
            )
            row = cursor.fetchone()
            return int(row["completed_sessions"]) if row else 0
        finally:
            cursor.close()

    def _fetch_completion_dates(self, conn, user_id: int) -> list[date]:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT DISTINCT DATE(completed_at) AS completed_date
                FROM study_task_completions
                WHERE user_id = %s
                ORDER BY completed_date DESC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            return [row["completed_date"] for row in rows if row.get("completed_date") is not None]
        finally:
            cursor.close()

    def _fetch_completed_task_ids(self, conn, user_id: int) -> list[int]:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT study_task_id
                FROM study_task_completions
                WHERE user_id = %s
                ORDER BY study_task_id ASC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            return [int(row["study_task_id"]) for row in rows if row.get("study_task_id") is not None]
        finally:
            cursor.close()

    def _calculate_day_streak(self, completion_dates: list[date]) -> int:
        if not completion_dates:
            return 0

        completion_date_set = set(completion_dates)
        current_day = date.today()
        streak = 0

        while current_day in completion_date_set:
            streak += 1
            current_day -= timedelta(days=1)

        return streak
