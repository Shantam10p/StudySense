import hashlib
import json

from app.agents.sensei_agent import SenseiAgent
from app.db.database import get_connection
from app.schemas.sensei import (
    ConceptItem,
    PracticeQuestion,
    SenseiChatRequest,
    SenseiChatResponse,
    SenseiContentRequest,
    SenseiContentResponse,
)


class SenseiService:
    def __init__(self) -> None:
        self.agent = SenseiAgent()

    def get_content(self, request: SenseiContentRequest, user_id: int) -> SenseiContentResponse:
        topic_hash = hashlib.sha256(request.topic.strip().lower().encode()).hexdigest()

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:

            # check if content already exists
            cursor.execute(
                "SELECT concepts_json, practice_json FROM sensei_topic_content "
                "WHERE user_id = %s AND course_id = %s AND topic_hash = %s",
                (user_id, request.course_id, topic_hash),
            )
            row = cursor.fetchone()

            if row:
                concepts = [ConceptItem(**c) for c in json.loads(row["concepts_json"])]
                practice_questions = [PracticeQuestion(**q) for q in json.loads(row["practice_json"])]
                return SenseiContentResponse(
                    topic=request.topic,
                    concepts=concepts,
                    practice_questions=practice_questions,
                )

            # not found — call the agent
            result = self.agent.generate_content(request)

            cursor.execute(
                "INSERT IGNORE INTO sensei_topic_content "
                "(user_id, course_id, topic_hash, topic, concepts_json, practice_json) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    user_id,
                    request.course_id,
                    topic_hash,
                    request.topic,
                    json.dumps(result["concepts"]),
                    json.dumps(result["practice_questions"]),
                ),
            )
            conn.commit()

            return SenseiContentResponse(
                topic=request.topic,
                concepts=[ConceptItem(**c) for c in result["concepts"]],
                practice_questions=[PracticeQuestion(**q) for q in result["practice_questions"]],
            )
        finally:
            cursor.close()
            conn.close()


    def send_message(self, request: SenseiChatRequest) -> SenseiChatResponse:
        reply = self.agent.chat(request)
        return SenseiChatResponse(reply=reply)
