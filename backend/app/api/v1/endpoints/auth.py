from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest):
    try:
        return auth_service.signup(payload)
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_409_CONFLICT if detail == "Email already registered" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    try:
        return auth_service.login(payload)
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_401_UNAUTHORIZED if detail in {"Invalid email or password", "User account is inactive"} else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc
