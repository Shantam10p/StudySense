from pydantic import BaseModel
from datetime import date
from typing import List

class PlannerGenerateRequest(BaseModel):
    course_name:str
    exam_date: date
    topics: List[str]
    daily_study_hours: float
    textbook: str | None = None

class StudyTask(BaseModel):
    title: str
    duration_minutes: int
    task_type: str

class DailyPlan(BaseModel):
    day: date
    tasks: List[StudyTask]

class PlannerGenerateResponse(BaseModel):
    course_name: str
    exam_date: date
    daily_plans: List[DailyPlan]

    