from fastapi import APIRouter
from typing import List

from app.db.database import get_connection
from app.schemas.course import CourseResponse

router = APIRouter()


@router.get("", response_model=List[CourseResponse])
def get_courses():
   
    #Get all courses from the database
 
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()

    cursor.close()
    conn.close()

    return courses

@router.get("/{course_id}", response_model = CourseResponse)
def get_course(course_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("Select * FROM courses WHERE id = %s", (course_id,))
    course = cursor.fetchone()

    cursor.close()
    conn.close()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
 

    return course