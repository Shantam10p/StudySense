from pydantic import BaseModel
from datetime import date, datetime


class CourseResponse(BaseModel):
    id: int
    course_name: str
    exam_date: date
    daily_study_hours: float
    created_at: datetime

class CoursePutRequest(BaseModel):
    course_name: str
    exam_date: date
    daily_study_hours: float