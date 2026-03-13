from fastapi import APIRouter, HTTPException, Response, status
from typing import List

from app.schemas.course import CoursePutRequest, CourseResponse
from app.services.course_service import CourseService

router = APIRouter()
course_service = CourseService()


@router.get("", response_model=List[CourseResponse])
def get_courses():
    return course_service.get_courses()


@router.get("/{course_id}", response_model = CourseResponse)
def get_course(course_id: int):
    course = course_service.get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int):
    deleted = course_service.delete_course(course_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course_put(course_id: int, payload: CoursePutRequest):
    updated_course = course_service.update_course(course_id, payload)
    if updated_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return updated_course
