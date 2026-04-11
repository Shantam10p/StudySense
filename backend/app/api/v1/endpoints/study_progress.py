from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.schemas.study_progress import DashboardStatsResponse, StudyTaskCompletionResponse
from app.services.study_progress_service import StudyProgressService

router = APIRouter()
study_progress_service = StudyProgressService()


@router.post("/tasks/{task_id}/complete", response_model=StudyTaskCompletionResponse)
def complete_study_task(task_id: int, current_user: dict = Depends(get_current_user)):
    try:
        return study_progress_service.complete_task(task_id, current_user["id"])
    except ValueError as exc:
        if str(exc) == "Task not found":
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    return study_progress_service.get_dashboard_stats(current_user["id"])
