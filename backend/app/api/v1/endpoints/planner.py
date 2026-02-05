from fastapi import APIRouter
from datetime import date, timedelta    

from app.schemas.planner import (
    PlannerGenerateRequest,
    PlannerGenerateResponse,
    DailyPlan,
    StudyTask,
)

router = APIRouter()

@router.post("/generate", response_model = PlannerGenerateResponse)
def generate_study_plan(payload: PlannerGenerateRequest):
    "Mock study plan , I will replace this with agent + DB logic"

    today = date.today()

    # Mock logic: just schedule first 3 topics for today
    tasks = []
    for topic in payload.topics[:3]:
        tasks.append(
            StudyTask(
                title = topic,
                duration_minutes = 60,
                task_type = "Study"
            )
        )

    daily_plan = DailyPlan(
        day = today,
        tasks = tasks
    )

    return PlannerGenerateResponse(
        course_name = payload.course_name,
        exam_date = payload.exam_date,
        daily_plans = [daily_plan]
    )


   