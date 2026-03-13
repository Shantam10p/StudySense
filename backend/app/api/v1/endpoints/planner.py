from fastapi import APIRouter, HTTPException
from app.schemas.planner import (
    PlannerCourseResponse,
    PlannerGenerateRequest,
    PlannerGenerateResponse,
)
from app.services.planner_service import PlannerService

router = APIRouter()
planner_service = PlannerService()

@router.post("/generate", response_model=PlannerGenerateResponse)
def generate_study_plan(payload: PlannerGenerateRequest):
    try:
        return planner_service.generate_plan(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/generate-ai", response_model=PlannerGenerateResponse)
def generate_ai_study_plan(payload: PlannerGenerateRequest):
    try:
        return planner_service.generate_plan(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("/course/{course_id}", response_model=PlannerCourseResponse)
def get_course_plan(course_id: int):
    try:
        return planner_service.get_plan_by_course_id(course_id)
    except ValueError as exc:
        if str(exc) == "Course not found":
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc