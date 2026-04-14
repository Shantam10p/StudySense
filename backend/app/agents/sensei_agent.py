import json
from typing import TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from app.core.config import get_settings
from app.schemas.sensei import SenseiChatRequest, SenseiContentRequest


class ContentAgentState(TypedDict):
    request: SenseiContentRequest
    concepts: list[dict]
    practice_questions: list[dict]


class ChatAgentState(TypedDict):
    request: SenseiChatRequest
    reply: str


class SenseiAgent:
    def __init__(self) -> None:
        settings = get_settings()
        self.llm = (
            ChatOpenAI(model=settings.PLANNER_AGENT_MODEL, api_key=settings.OPENAI_API_KEY, temperature=0)
            if settings.OPENAI_API_KEY
            else None
        )

        # content graph
        content_graph = StateGraph(ContentAgentState)
        content_graph.add_node("generate_content", self._generate_content)
        content_graph.add_edge(START, "generate_content")
        content_graph.add_edge("generate_content", END)
        self.content_graph = content_graph.compile()

        # chat graph
        chat_graph = StateGraph(ChatAgentState)
        chat_graph.add_node("generate_reply", self._generate_reply)
        chat_graph.add_edge(START, "generate_reply")
        chat_graph.add_edge("generate_reply", END)
        self.chat_graph = chat_graph.compile()

    def generate_content(self, request: SenseiContentRequest) -> dict:
        result = self.content_graph.invoke(
            {"request": request, "concepts": [], "practice_questions": []}
        )
        return {"concepts": result["concepts"], "practice_questions": result["practice_questions"]}

    def chat(self, request: SenseiChatRequest) -> str:
        result = self.chat_graph.invoke({"request": request, "reply": ""})
        return result["reply"]

    def _generate_content(self, state: ContentAgentState) -> ContentAgentState:
        request = state["request"]

        if self.llm is None:
            return {
                **state,
                "concepts": self._fallback_concepts(request.topic),
                "practice_questions": self._fallback_practice(request.topic),
            }

        prompt = f"""You are Sensei AI, a focused study assistant. A student needs exam-ready notes on the following:

Topic: {request.topic}
Course: {request.course_name}

Your job is to produce structured study notes that cover EVERY subtopic a student needs for this topic — ordered from foundational to advanced, so each concept builds naturally on the last. Think of it like a smart friend explaining the topic from scratch in the right order.

Return raw valid JSON only. No markdown, no explanation outside the JSON.

{{
  "concepts": [
    {{
      "title": "subtopic name (short, clear)",
      "definition": "2-3 sentence explanation. If this concept builds on a previous one, briefly reference it (e.g. 'Building on tables from above...'). Plain language a student can grasp immediately.",
      "key_points": [
        "exam-specific fact, rule, or gotcha — not generic filler",
        "another point a student must know for exams",
        "common mistake or trick question around this concept",
        "how this differs from a similar concept if relevant",
        "one more essential point"
      ],
      "example": "A concrete, subject-specific example that makes this real. For abstract concepts, use a scenario. For syntax-heavy topics, describe what the code does in plain English.",
      "code_example": "Only include this field if the concept has syntax, commands, queries, or formulas. Write clean, minimal code that demonstrates the concept. Omit this field entirely if not applicable."
    }}
  ],
  "practice_questions": [
    {{
      "question": "question text",
      "answer": "direct, clear answer. For conceptual questions explain the reasoning briefly. For tasks show the correct solution with a one-line explanation of why."
    }}
  ]
}}

Rules:
- Cover ALL subtopics within {request.topic} — aim for 8-14 concepts
- Order concepts so foundational ones come first and each logically leads to the next
- Key points must be specific and actionable, never generic filler like "this is important to know"
- Include code_example for any concept involving syntax, queries, commands, formulas, or code
- Practice questions must be a mix of: short direct conceptual questions ("What is X?", "What is the difference between X and Y?") AND hands-on tasks ("Write a query to...", "What does this code output?", "Fix this query"). Aim for 8-10 questions total, roughly half conceptual half practical. Keep questions short and direct — no long essay prompts.
- Return only the JSON object, nothing else"""

        try:
            response = self.llm.invoke(prompt)
            content = response.content if isinstance(response.content, str) else ""
            parsed = json.loads(content)
            concepts = parsed.get("concepts", [])
            practice_questions = parsed.get("practice_questions", [])
            if not isinstance(concepts, list) or not isinstance(practice_questions, list):
                raise ValueError("Invalid structure")
        except (json.JSONDecodeError, ValueError, TypeError):
            concepts = self._fallback_concepts(request.topic)
            practice_questions = self._fallback_practice(request.topic)

        return {**state, "concepts": concepts, "practice_questions": practice_questions}

    def _generate_reply(self, state: ChatAgentState) -> ChatAgentState:
        request = state["request"]

        if self.llm is None:
            return {**state, "reply": "I'm not available right now. Please try again later."}

        system = SystemMessage(content=f"""You are Sensei AI, an educational assistant helping a student study.
Topic: {request.topic}
Course: {request.course_name}
Keep answers focused, educational, and concise. If asked something off-topic, gently redirect to {request.topic}.""")

        messages = [system]
        for msg in request.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        messages.append(HumanMessage(content=request.message))

        try:
            response = self.llm.invoke(messages)
            reply = response.content if isinstance(response.content, str) else "I couldn't generate a response."
        except Exception:
            reply = "I'm having trouble connecting right now. Please try again."

        return {**state, "reply": reply}

    def _fallback_concepts(self, topic: str) -> list[dict]:
        return [
            {
                "title": "Core Definition",
                "definition": f"{topic} refers to the fundamental principles and rules that define this subject area.",
                "key_points": [
                    f"{topic} has a precise meaning in this course context.",
                    "Understanding the definition is the first step before applying it.",
                    "Related terms often build on this core concept.",
                ],
                "example": f"A basic example of {topic} would involve applying its core rules in a straightforward scenario.",
            },
            {
                "title": "Why It Matters",
                "definition": f"Understanding {topic} is essential as it underpins many practical applications in this course.",
                "key_points": [
                    f"{topic} appears frequently in assessments and real-world use.",
                    "Mastery here makes advanced topics easier to grasp.",
                    "Skipping this concept creates gaps that compound later.",
                ],
                "example": f"Without understanding {topic}, common tasks in this subject become difficult to reason about.",
            },
        ]

    def _fallback_practice(self, topic: str) -> list[dict]:
        return [
            {"question": f"What is the core definition of {topic}?", "answer": f"{topic} is defined by its fundamental properties and the problems it addresses."},
            {"question": f"How does {topic} apply in a real-world context?", "answer": f"{topic} appears in various real-world scenarios and is used to solve specific problems in this domain."},
            {"question": f"What is one common misconception about {topic}?", "answer": f"A common mistake is oversimplifying {topic} — it has nuances that only become clear through careful study."},
        ]
