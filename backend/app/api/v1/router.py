from fastapi import APIRouter

from app.api.v1.endpoints import chat, health, planner

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(planner.router, prefix="/planner", tags=["planner"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
