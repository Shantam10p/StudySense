from pydantic import BaseModel


class StudyTaskCompletionResponse(BaseModel):
    task_id: int
    completed: bool


class DashboardStatsResponse(BaseModel):
    completed_sessions: int
    day_streak: int
