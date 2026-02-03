from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
def get_planner_status() -> dict:
    raise HTTPException(status_code=501, detail="Not implemented")
