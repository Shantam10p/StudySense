import json
from datetime import date
from typing import TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from app.core.config import get_settings
from app.schemas.planner import PlannerGenerateRequest


class PlannerAgentState(TypedDict):
    payload: PlannerGenerateRequest
    normalized_topics: list[str]
    analysis: dict


class PlannerAgent:
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = settings.PLANNER_AGENT_MODEL
        self.api_key = settings.OPENAI_API_KEY
        self.llm = ChatOpenAI(model=self.model_name, api_key=self.api_key, temperature=0) if self.api_key else None
        graph = StateGraph(PlannerAgentState)
        graph.add_node("prepare_topics", self._prepare_topics)
        graph.add_node("analyze_topics", self._analyze_topics)
        graph.add_edge(START, "prepare_topics")
        graph.add_edge("prepare_topics", "analyze_topics")
        graph.add_edge("analyze_topics", END)
        self.graph = graph.compile()

    def analyze(self, payload: PlannerGenerateRequest) -> dict:
        result = self.graph.invoke(
            {
                "payload": payload,
                "normalized_topics": [],
                "analysis": {"topics": []},
            }
        )
        return result["analysis"]

    def _prepare_topics(self, state: PlannerAgentState) -> PlannerAgentState:
        payload = state["payload"]
        normalized_topics = [topic.strip() for topic in payload.topics if topic.strip()]
        return {
            **state,
            "normalized_topics": normalized_topics,
        }

    def _analyze_topics(self, state: PlannerAgentState) -> PlannerAgentState:
        payload = state["payload"]
        normalized_topics = state["normalized_topics"]
        days_until_exam = max(1, (payload.exam_date - date.today()).days)
        total_available_minutes = days_until_exam * int(payload.daily_study_hours * 60)

        if not normalized_topics:
            return {
                **state,
                "analysis": {"topics": []},
            }

        if self.llm is None:
            return {
                **state,
                "analysis": self._build_fallback_analysis(normalized_topics, total_available_minutes),
            }

        prompt = f"""You are a study planning assistant. Return raw valid JSON only. No markdown fences, no explanation.

Create a study plan for the following:

Course: {payload.course_name}
Exam date: {payload.exam_date.isoformat()}
Days until exam: {days_until_exam}
Daily study hours: {payload.daily_study_hours}
Total available minutes: {total_available_minutes}
Topics: {json.dumps(normalized_topics)}

Step 1 — Budget: There are {total_available_minutes} total minutes available. The sum of (session_count × study_session_minutes) + (review_sessions × review_session_minutes) across ALL topics must be ≤ {total_available_minutes}. Distribute this budget proportionally based on each topic's priority and difficulty.

Step 2 — Session design:
- EVERY topic must get at least 1 study session — no topic can be left with session_count = 0.
- Harder/higher-priority topics get longer sessions (30–60 min) and more of them.
- Easier/lower-priority topics get shorter sessions (15–30 min) and fewer.
- Vary durations per topic — each topic should reflect its own difficulty.
- Review sessions are earned, not default. Only assign them if the budget comfortably allows after guaranteeing every topic has at least 1 study session. Default review_sessions to 0.

Step 3 — Ordering: Set learning_order based purely on prerequisite dependency — what must be understood BEFORE something else can be learned. This has nothing to do with difficulty or priority. A topic that is easy but foundational (e.g. Arrays) must still come before a hard topic that depends on it (e.g. Linked Lists, Trees, Graphs). Ignore difficulty and priority when deciding order. learning_order 1 = must be studied first.

Return JSON matching this schema:
{{"topics":[{{"name":"topic name","priority":"high|medium|low","difficulty":"easy|medium|hard","total_minutes":"<int>","session_count":"<int>","review_sessions":"<int: 0 if not needed>","study_session_minutes":"<int: varies per topic>","review_session_minutes":"<int: 0 if no reviews>","learning_order":"<int>"}}]}}

Critical: The total scheduled minutes across all topics must not exceed {total_available_minutes}. Every topic must have session_count ≥ 1.
Return only the JSON object."""

        try:
            response = self.llm.invoke(prompt)
            content = response.content if isinstance(response.content, str) else ""
            print("Planner agent raw LLM response:", content)
            parsed = json.loads(content)
            topics = parsed.get("topics")
            analysis = {"topics": topics} if isinstance(topics, list) else self._build_fallback_analysis(normalized_topics, total_available_minutes)
        except (json.JSONDecodeError, ValueError, TypeError):
            analysis = self._build_fallback_analysis(normalized_topics, total_available_minutes)

        return {
            **state,
            "analysis": analysis,
        }

    def _build_fallback_analysis(self, topics: list[str], total_available_minutes: int = 0) -> dict:
        n = len(topics) or 1
        session_minutes = 60
        # give each topic an equal share of the budget, minimum 1 session each
        budget_per_topic = max(session_minutes, total_available_minutes // n) if total_available_minutes else session_minutes
        sessions_per_topic = max(1, budget_per_topic // session_minutes)
        return {
            "topics": [
                {
                    "name": topic,
                    "priority": "medium",
                    "difficulty": "medium",
                    "total_minutes": sessions_per_topic * session_minutes,
                    "session_count": sessions_per_topic,
                    "review_sessions": 0,
                    "study_session_minutes": session_minutes,
                    "review_session_minutes": 0,
                    "learning_order": index,
                }
                for index, topic in enumerate(topics, start=1)
            ]
        }
