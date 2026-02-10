from fastapi import APIRouter
from datetime import date, timedelta    
from app.db.database import get_connection


from app.schemas.planner import (
    PlannerGenerateRequest,
    PlannerGenerateResponse,
    DailyPlan,
    StudyTask,
)

router = APIRouter()

@router.post("/generate", response_model=PlannerGenerateResponse)
def generate_study_plan(payload: PlannerGenerateRequest):
    
    #Generate study plan and store course info in DB

    #SAVE COURSE TO DATABASE
    conn = get_connection()
    cursor = conn.cursor()

    # TO REMEMBER: %s are placeholders that are safely replaced with values by the MySQL driver
    insert_query = """
    INSERT INTO courses (course_name, exam_date, daily_study_hours)
    VALUES (%s, %s, %s)  
    """

    cursor.execute(
        insert_query,
        (
            payload.course_name,
            payload.exam_date,
            payload.daily_study_hours,
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    # GENERATE STUDY PLAN 
    today = date.today()
    topics_today = payload.topics[:3]

    total_minutes = int(payload.daily_study_hours * 60)
    minutes_per_task = total_minutes // len(topics_today)

    tasks = []
    for topic in topics_today:
        tasks.append(
            StudyTask(
                title=topic,
                duration_minutes=minutes_per_task,
                task_type="study",
            )
        )

    daily_plan = DailyPlan(
        day=today,
        tasks=tasks,
    )

    #RETURN RESPONSE
    return PlannerGenerateResponse(
        course_name=payload.course_name,
        exam_date=payload.exam_date,
        daily_plans=[daily_plan],
    )

   