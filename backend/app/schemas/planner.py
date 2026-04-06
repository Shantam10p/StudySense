from pydantic import BaseModel
from datetime import date
from typing import List

class PlannerGenerateRequest(BaseModel):
    course_name:str
    exam_date: date
    topics: List[str]
    daily_study_hours: float
    textbook: str | None = None

class StudyTaskResponse(BaseModel):
    id: int
    title: str
    duration_minutes: int
    task_type: str
    position: int

class DailyPlanResponse(BaseModel):
    id: int
    day: date
    tasks: List[StudyTaskResponse]

class UnscheduledTaskResponse(BaseModel):
    title: str
    duration_minutes: int
    task_type: str
    topic: str

class PlannerGenerateResponse(BaseModel):
    course_id: int
    course_name: str
    exam_date: date
    daily_plans: List[DailyPlanResponse]
    unscheduled: List[UnscheduledTaskResponse] = []
    warning: str | None = None

class PlannerCourseResponse(PlannerGenerateResponse):
    pass