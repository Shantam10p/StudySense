import hashlib
import json
from datetime import date, timedelta

from app.db.database import get_connection
from app.schemas.planner import (
    DailyPlanResponse,
    PlannerCourseResponse,
    PlannerGenerateRequest,
    PlannerGenerateResponse,
    StudyTaskResponse,
)


class PlannerService:
    def __init__(self) -> None:
        return

    def generate_plan(self, payload: PlannerGenerateRequest, user_id: int) -> PlannerGenerateResponse:
        normalized_topics = self._normalize_topics(payload.topics)
        if not normalized_topics:
            raise ValueError("At least one topic is required")

        if payload.daily_study_hours <= 0:
            raise ValueError("Daily study hours must be greater than 0")

        today = date.today()
        if payload.exam_date <= today:
            raise ValueError("Exam date must be in the future")

        input_hash = self._build_input_hash(payload, normalized_topics)
        conn = get_connection()
        try:
            existing_course_id = self._find_existing_course_id(conn, input_hash, user_id)
            if existing_course_id is not None and self._course_has_plan(conn, existing_course_id):
                return self.get_plan_by_course_id(existing_course_id, user_id)

            if existing_course_id is None:
                course_id = self._create_course(conn, payload, input_hash, user_id)
            else:
                course_id = existing_course_id

            generated_days = self._build_deterministic_schedule(
                normalized_topics=normalized_topics,
                exam_date=payload.exam_date,
                daily_study_hours=payload.daily_study_hours,
                textbook=payload.textbook,
            )

            self._replace_course_plan(conn, course_id, generated_days)
            return self.get_plan_by_course_id(course_id, user_id)
        finally:
            conn.close()

    def get_plan_by_course_id(self, course_id: int, user_id: int) -> PlannerCourseResponse:
        conn = get_connection()
        try:
            course = self._fetch_course(conn, course_id, user_id)
            if course is None:
                raise ValueError("Course not found")

            daily_plans = self._fetch_daily_plan_rows(conn, course_id)
            return PlannerCourseResponse(
                course_id=course["id"],
                course_name=course["course_name"],
                exam_date=course["exam_date"],
                daily_plans=daily_plans,
            )
        finally:
            conn.close()

    def _normalize_topics(self, topics: list[str]) -> list[str]:
        return [topic.strip() for topic in topics if topic.strip()]

    def _build_input_hash(self, payload: PlannerGenerateRequest, topics: list[str]) -> str:
        normalized_payload = {
            "course_name": payload.course_name.strip(),
            "exam_date": payload.exam_date.isoformat(),
            "topics": topics,
            "daily_study_hours": float(payload.daily_study_hours),
            "textbook": (payload.textbook or "").strip(),
        }
        encoded_payload = json.dumps(normalized_payload, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded_payload).hexdigest()

    def _find_existing_course_id(self, conn, input_hash: str, user_id: int) -> int | None:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id
                FROM courses
                WHERE input_hash = %s AND user_id = %s
                ORDER BY id DESC
                LIMIT 1
                """,
                (input_hash, user_id),
            )
            row = cursor.fetchone()
            return row["id"] if row else None
        finally:
            cursor.close()

    def _course_has_plan(self, conn, course_id: int) -> bool:
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT 1 FROM daily_plans WHERE course_id = %s LIMIT 1",
                (course_id,),
            )
            return cursor.fetchone() is not None
        finally:
            cursor.close()

    def _create_course(self, conn, payload: PlannerGenerateRequest, input_hash: str, user_id: int) -> int:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO courses (course_name, exam_date, daily_study_hours, input_hash, user_id)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    payload.course_name.strip(),
                    payload.exam_date,
                    payload.daily_study_hours,
                    input_hash,
                    user_id,
                ),
            )
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()

    def _build_deterministic_schedule(
        self,
        normalized_topics: list[str],
        exam_date: date,
        daily_study_hours: float,
        textbook: str | None,
    ) -> list[dict]:
        today = date.today()
        available_day_count = max(1, (exam_date - today).days)
        plan_dates = [today + timedelta(days=index) for index in range(available_day_count)]

        total_minutes = max(30, int(daily_study_hours * 60))
        max_tasks_per_day = max(1, total_minutes // 30)

        sessions = []
        for topic in normalized_topics:
            sessions.append({"topic": topic, "task_type": "study"})
            if len(plan_dates) > 1:
                sessions.append({"topic": topic, "task_type": "review"})

        day_sessions: list[list[dict]] = [[] for _ in plan_dates]
        day_index = 0
        for session in sessions:
            while day_index < len(day_sessions) - 1 and len(day_sessions[day_index]) >= max_tasks_per_day:
                day_index += 1
            day_sessions[day_index].append(session)

        generated_days = []
        for current_date, sessions_for_day in zip(plan_dates, day_sessions):
            if not sessions_for_day:
                continue

            minutes_per_task = max(30, total_minutes // len(sessions_for_day))
            tasks = []
            for position, session in enumerate(sessions_for_day, start=1):
                tasks.append(
                    {
                        "title": self._build_task_title(
                            topic=session["topic"],
                            task_type=session["task_type"],
                            textbook=textbook,
                        ),
                        "duration_minutes": minutes_per_task,
                        "task_type": session["task_type"],
                        "position": position,
                    }
                )

            generated_days.append({"day": current_date, "tasks": tasks})

        return generated_days

    def _build_task_title(self, topic: str, task_type: str, textbook: str | None) -> str:
        cleaned_textbook = (textbook or "").strip()
        if task_type == "review":
            return f"Review {topic}"
        if cleaned_textbook:
            return f"Study {topic} using {cleaned_textbook}"
        return f"Study {topic}"

    def _replace_course_plan(self, conn, course_id: int, generated_days: list[dict]) -> None:
        delete_cursor = conn.cursor()
        try:
            delete_cursor.execute("DELETE FROM daily_plans WHERE course_id = %s", (course_id,))
            conn.commit()
        finally:
            delete_cursor.close()

        day_cursor = conn.cursor()
        task_cursor = conn.cursor()
        try:
            for generated_day in generated_days:
                day_cursor.execute(
                    """
                    INSERT INTO daily_plans (course_id, plan_date)
                    VALUES (%s, %s)
                    """,
                    (course_id, generated_day["day"]),
                )
                daily_plan_id = day_cursor.lastrowid

                for task in generated_day["tasks"]:
                    task_cursor.execute(
                        """
                        INSERT INTO study_tasks (daily_plan_id, title, duration_minutes, task_type, position)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            daily_plan_id,
                            task["title"],
                            task["duration_minutes"],
                            task["task_type"],
                            task["position"],
                        ),
                    )
            conn.commit()
        finally:
            day_cursor.close()
            task_cursor.close()

    def _fetch_course(self, conn, course_id: int, user_id: int) -> dict | None:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT id, course_name, exam_date FROM courses WHERE id = %s AND user_id = %s",
                (course_id, user_id),
            )
            return cursor.fetchone()
        finally:
            cursor.close()

    def _fetch_daily_plan_rows(self, conn, course_id: int) -> list[DailyPlanResponse]:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT
                    dp.id AS daily_plan_id,
                    dp.plan_date,
                    st.id AS study_task_id,
                    st.title,
                    st.duration_minutes,
                    st.task_type,
                    st.position
                FROM daily_plans dp
                LEFT JOIN study_tasks st ON st.daily_plan_id = dp.id
                WHERE dp.course_id = %s
                ORDER BY dp.plan_date ASC, st.position ASC
                """,
                (course_id,),
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()

        daily_plan_map: dict[int, DailyPlanResponse] = {}
        for row in rows:
            daily_plan_id = row["daily_plan_id"]
            if daily_plan_id not in daily_plan_map:
                daily_plan_map[daily_plan_id] = DailyPlanResponse(
                    id=daily_plan_id,
                    day=row["plan_date"],
                    tasks=[],
                )

            if row["study_task_id"] is not None:
                daily_plan_map[daily_plan_id].tasks.append(
                    StudyTaskResponse(
                        id=row["study_task_id"],
                        title=row["title"],
                        duration_minutes=row["duration_minutes"],
                        task_type=row["task_type"],
                        position=row["position"],
                    )
                )

        return list(daily_plan_map.values())
