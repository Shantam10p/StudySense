from fastapi import APIRouter

from app.api.v1.endpoints import auth, chat, health, planner, courses, study_progress

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(planner.router, prefix="/planner", tags=["planner"])
api_router.include_router(study_progress.router, prefix="/study-progress", tags=["study-progress"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])