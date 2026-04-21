import hashlib
import json
from datetime import date, timedelta

from app.agents.planner_agent import PlannerAgent
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
        self.planner_agent = PlannerAgent()

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

            topic_analysis = self.planner_agent.analyze(payload)
            scheduled_sessions = self._build_scheduled_sessions(topic_analysis, normalized_topics)

            generated_days, unscheduled = self._build_deterministic_schedule(
                sessions=scheduled_sessions,
                exam_date=payload.exam_date,
                daily_study_hours=payload.daily_study_hours,
                textbook=payload.textbook,
            )

            self._replace_course_plan(conn, course_id, generated_days)
            stored_plan = self.get_plan_by_course_id(course_id, user_id)
            warning = None
            if unscheduled:
                warning = "We created your study plan, but some sessions could not fit within your daily study limit. Consider increasing your study time or extending your timeline."

            return PlannerGenerateResponse(
                course_id=stored_plan.course_id,
                course_name=stored_plan.course_name,
                exam_date=stored_plan.exam_date,
                daily_plans=stored_plan.daily_plans,
                unscheduled=unscheduled,
                warning=warning,
            )
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
                unscheduled=[],
                warning=None,
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

    def _build_scheduled_sessions(self, topic_analysis: dict, fallback_topics: list[str]) -> list[dict]:
        analyzed_topics = topic_analysis.get("topics") if isinstance(topic_analysis, dict) else None
        if not isinstance(analyzed_topics, list):
            return self._build_fallback_sessions(fallback_topics)

        valid_topics: list[dict] = []
        for topic in analyzed_topics:
            if not isinstance(topic, dict):
                continue

            name = str(topic.get("name", "")).strip()
            if not name:
                continue

            valid_topics.append(topic)

        if not valid_topics:
            return self._build_fallback_sessions(fallback_topics)

        sorted_topics = sorted(
            valid_topics,
            key=lambda topic: int(topic.get("learning_order", 9999)),
        )

        topic_sessions = [self._build_topic_sessions(topic) for topic in sorted_topics]
        study_queues = [
            [session for session in sessions if session.get("task_type") == "study"]
            for sessions in topic_sessions
        ]
        review_queues = [
            [session for session in sessions if session.get("task_type") == "review"]
            for sessions in topic_sessions
        ]

        sessions: list[dict] = []

        while any(study_queues):
            for queue in study_queues:
                if queue:
                    sessions.append(queue.pop(0))

        while any(review_queues):
            for queue in review_queues:
                if queue:
                    sessions.append(queue.pop(0))

        return sessions or self._build_fallback_sessions(fallback_topics)

    def _build_topic_sessions(self, topic: dict) -> list[dict]:
        name = str(topic.get("name", "")).strip()
        session_count = int(topic.get("session_count", 2))
        review_sessions = int(topic.get("review_sessions", 1))
        study_session_minutes = int(topic.get("study_session_minutes", 60))
        review_session_minutes = int(topic.get("review_session_minutes", 30))
        priority = str(topic.get("priority", "medium")).strip().lower() or "medium"
        learning_order = int(topic.get("learning_order", 9999))

        sessions = [
            {
                "topic": name,
                "task_type": "study",
                "duration_minutes": study_session_minutes,
                "priority": priority,
                "learning_order": learning_order,
            }
            for _ in range(session_count)
        ]

        sessions.extend(
            {
                "topic": name,
                "task_type": "review",
                "duration_minutes": review_session_minutes,
                "priority": priority,
                "learning_order": learning_order,
            }
            for _ in range(review_sessions)
        )
        return sessions

    def _build_fallback_sessions(self, topics: list[str]) -> list[dict]:
        sessions: list[dict] = []
        for topic in topics:
            sessions.extend(
                [
                    {
                        "topic": topic,
                        "task_type": "study",
                        "duration_minutes": 60,
                        "priority": "medium",
                        "learning_order": 9999,
                    },
                    {
                        "topic": topic,
                        "task_type": "study",
                        "duration_minutes": 60,
                        "priority": "medium",
                        "learning_order": 9999,
                    },
                    {
                        "topic": topic,
                        "task_type": "review",
                        "duration_minutes": 30,
                        "priority": "medium",
                        "learning_order": 9999,
                    },
                ]
            )
        return sessions

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
        sessions: list[dict],
        exam_date: date,
        daily_study_hours: float,
        textbook: str | None,
    ) -> tuple[list[dict], list[dict]]:
        today = date.today()
        available_day_count = max(1, (exam_date - today).days)
        plan_dates = [today + timedelta(days=index) for index in range(available_day_count)]

        total_minutes = max(30, int(daily_study_hours * 60))

        n_days = len(plan_dates)
        day_sessions: list[list[dict]] = [[] for _ in plan_dates]
        day_minutes_used = [0] * n_days
        unscheduled: list[dict] = []

        def _session_sort_key(session: dict) -> int:
            return int(session.get("learning_order", 9999))

        study_sessions = sorted(
            [s for s in sessions if s.get("task_type") != "review"],
            key=_session_sort_key,
        )
        review_sessions = sorted(
            [s for s in sessions if s.get("task_type") == "review"],
            key=_session_sort_key,
        )

        max_sessions_per_day = -(-len(sessions) // n_days)  # ceil(n / d)

        def _place_session(session: dict, earliest_day: int) -> bool:
            session_minutes = int(session.get("duration_minutes", 30))
            idx = earliest_day
            while idx < n_days - 1 and (
                day_minutes_used[idx] + session_minutes > total_minutes
                or len(day_sessions[idx]) >= max_sessions_per_day
            ):
                idx += 1
            if (
                day_minutes_used[idx] + session_minutes > total_minutes
                or len(day_sessions[idx]) >= max_sessions_per_day
            ):
                unscheduled.append(session)
                return False
            day_sessions[idx].append(session)
            day_minutes_used[idx] += session_minutes
            return True

        day_index = 0
        for session in study_sessions:
            placed = _place_session(session, earliest_day=day_index)
            if placed:
                day_index = next(
                    (i for i, d in enumerate(day_sessions) if session in d),
                    day_index,
                )

        topic_last_study_day: dict[str, int] = {}
        for i, day in enumerate(day_sessions):
            for s in day:
                if s.get("task_type") != "review":
                    topic_last_study_day[s["topic"]] = i

        for review in review_sessions:
            topic = review["topic"]
            earliest = min(topic_last_study_day.get(topic, 0) + 1, n_days - 1)
            _place_session(review, earliest_day=earliest)

        generated_days = []
        study_topic_counts: dict[str, int] = {}
        for current_date, sessions_for_day in zip(plan_dates, day_sessions):
            if not sessions_for_day:
                continue

            tasks = []
            for position, session in enumerate(sessions_for_day, start=1):
                topic = session["topic"]
                task_type = session["task_type"]
                study_occurrence = None
                if task_type != "review":
                    study_topic_counts[topic] = study_topic_counts.get(topic, 0) + 1
                    study_occurrence = study_topic_counts[topic]

                tasks.append(
                    {
                        "title": self._build_task_title(
                            topic=topic,
                            task_type=task_type,
                            textbook=textbook,
                            study_occurrence=study_occurrence,
                        ),
                        "duration_minutes": int(session.get("duration_minutes", 30)),
                        "task_type": task_type,
                        "position": position,
                    }
                )

            generated_days.append({"day": current_date, "tasks": tasks})

        unscheduled_tasks = [
            {
                "title": self._build_task_title(
                    topic=session["topic"],
                    task_type=session["task_type"],
                    textbook=textbook,
                ),
                "duration_minutes": int(session.get("duration_minutes", 30)),
                "task_type": session["task_type"],
                "topic": session["topic"],
            }
            for session in unscheduled
        ]

        return generated_days, unscheduled_tasks

    def _build_task_title(
        self,
        topic: str,
        task_type: str,
        textbook: str | None,
        study_occurrence: int | None = None,
    ) -> str:
        cleaned_textbook = (textbook or "").strip()
        if task_type == "review":
            return f"Review {topic}"
        action = "Study"
        if study_occurrence == 2:
            action = "Continue"
        elif study_occurrence and study_occurrence >= 3:
            action = "Revisit"
        if cleaned_textbook:
            return f"{action} {topic} using {cleaned_textbook}"
        return f"{action} {topic}"

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
