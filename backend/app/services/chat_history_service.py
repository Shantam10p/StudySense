from app.db.database import get_connection
from app.schemas.sensei import ChatHistoryMessage, ChatHistoryResponse


class ChatHistoryService:
    def get_history(self, task_id: int, user_id: int) -> ChatHistoryResponse:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT id, role, content FROM chat_messages "
                "WHERE task_id = %s AND user_id = %s ORDER BY created_at ASC",
                (task_id, user_id),
            )
            rows = cursor.fetchall()
            messages = [ChatHistoryMessage(id=r["id"], role=r["role"], content=r["content"]) for r in rows]
            return ChatHistoryResponse(task_id=task_id, messages=messages)
        finally:
            cursor.close()
            conn.close()

    def save_message(self, task_id: int, user_id: int, role: str, content: str) -> ChatHistoryMessage:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "INSERT INTO chat_messages (user_id, task_id, role, content) VALUES (%s, %s, %s, %s)",
                (user_id, task_id, role, content),
            )
            conn.commit()
            message_id = cursor.lastrowid
            return ChatHistoryMessage(id=message_id, role=role, content=content)
        finally:
            cursor.close()
            conn.close()

    def delete_history(self, task_id: int, user_id: int) -> None:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "DELETE FROM chat_messages WHERE task_id = %s AND user_id = %s",
                (task_id, user_id),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()
