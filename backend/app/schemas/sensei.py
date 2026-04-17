from pydantic import BaseModel
from typing import List, Optional


class ConceptItem(BaseModel):
    title: str
    definition: str
    key_points: List[str]
    example: Optional[str] = None
    code_example: Optional[str] = None


class PracticeQuestion(BaseModel):
    question: str
    answer: str


#Content

class SenseiContentRequest(BaseModel):
    topic: str
    course_name: str
    course_id: int


class SenseiContentResponse(BaseModel):
    topic: str
    concepts: List[ConceptItem]
    practice_questions: List[PracticeQuestion]


#Chat

class ChatMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str


class SenseiChatRequest(BaseModel):
    topic: str
    course_name: str
    history: List[ChatMessage]
    message: str


class SenseiChatResponse(BaseModel):
    reply: str


# Chat History

class ChatHistoryMessage(BaseModel):
    id: int
    role: str
    content: str

class ChatHistoryResponse(BaseModel):
    task_id: int
    messages: List[ChatHistoryMessage]

class SaveMessageRequest(BaseModel):
    task_id: int
    role: str
    content: str
