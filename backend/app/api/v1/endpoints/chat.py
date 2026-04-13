from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.schemas.sensei import (
    SenseiChatRequest,
    SenseiChatResponse,
    SenseiContentRequest,
    SenseiContentResponse,
)
from app.services.sensei_service import SenseiService

router = APIRouter()
sensei_service = SenseiService()


@router.post("/content", response_model=SenseiContentResponse)
def get_content(payload: SenseiContentRequest, current_user: dict = Depends(get_current_user)):
    try:
        return sensei_service.get_content(payload, current_user["id"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to generate content") from exc


@router.post("/message", response_model=SenseiChatResponse)
def send_message(payload: SenseiChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        return sensei_service.send_message(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to get Sensei response") from exc
