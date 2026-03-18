from fastapi import APIRouter, HTTPException, Response, status
from fastapi import Depends
from typing import List

from app.api.deps import get_current_user
from app.schemas.course import CoursePutRequest, CourseResponse
from app.services.course_service import CourseService

router = APIRouter()
course_service = CourseService()


@router.get("", response_model=List[CourseResponse])
def get_courses(current_user: dict = Depends(get_current_user)):
    return course_service.get_courses(current_user["id"])


@router.get("/{course_id}", response_model = CourseResponse)
def get_course(course_id: int, current_user: dict = Depends(get_current_user)):
    course = course_service.get_course(course_id, current_user["id"])
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, current_user: dict = Depends(get_current_user)):
    deleted = course_service.delete_course(course_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course_put(course_id: int, payload: CoursePutRequest, current_user: dict = Depends(get_current_user)):
    updated_course = course_service.update_course(course_id, payload, current_user["id"])
    if updated_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated_course
