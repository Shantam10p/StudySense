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

        if not normalized_topics:
            return {
                **state,
                "analysis": {"topics": []},
            }

        if self.llm is None:
            return {
                **state,
                "analysis": self._build_fallback_analysis(normalized_topics),
            }

        prompt = (
            "You are a study planning assistant. "
            "You must return raw valid JSON only. "
            "Do not wrap the JSON in Markdown code fences. "
            "Do not include any explanation or extra text. "
            "Return only valid JSON with this shape: "
            '{"topics":[{"name":"string","priority":"high|medium|low","difficulty":"easy|medium|hard","total_minutes":120,"session_count":2,"review_sessions":1,"study_session_minutes":45,"review_session_minutes":20,"learning_order":1}]}. '
            "Choose larger total_minutes and more sessions for harder or higher-priority topics. "
            "Set study_session_minutes and review_session_minutes to appropriate values for each topic instead of defaulting to the same duration for every topic. "
            "Do not reuse the same study_session_minutes or review_session_minutes for most topics unless the topic difficulty and study style are genuinely very similar. "
            "Assign review_sessions based on priority, difficulty, and time remaining before the exam. "
            "Do not give nearly every topic a review session by default. "
            "Low-priority or easy topics may need zero review sessions, especially when time is limited. "
            "Set learning_order so foundational topics come before dependent topics. "
            f"Course: {payload.course_name}. "
            f"Exam date: {payload.exam_date.isoformat()}. "
            f"Days until exam: {days_until_exam}. "
            f"Daily study hours: {payload.daily_study_hours}. "
            f"Topics: {json.dumps(normalized_topics)}"
        )

        try:
            response = self.llm.invoke(prompt)
            content = response.content if isinstance(response.content, str) else ""
            print("Planner agent raw LLM response:", content)
            parsed = json.loads(content)
            topics = parsed.get("topics")
            analysis = {"topics": topics} if isinstance(topics, list) else self._build_fallback_analysis(normalized_topics)
        except (json.JSONDecodeError, ValueError, TypeError):
            analysis = self._build_fallback_analysis(normalized_topics)

        return {
            **state,
            "analysis": analysis,
        }

    def _build_fallback_analysis(self, topics: list[str]) -> dict:
        return {
            "topics": [
                {
                    "name": topic,
                    "priority": "medium",
                    "difficulty": "medium",
                    "total_minutes": 120,
                    "session_count": 2,
                    "review_sessions": 1,
                    "study_session_minutes": 60,
                    "review_session_minutes": 30,
                    "learning_order": index,
                }
                for index, topic in enumerate(topics, start=1)
            ]
        }
