# School Years Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
import uuid

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["school_years"])


# Pydantic Models
from pydantic import BaseModel

class SchoolYearCreate(BaseModel):
    name: str
    semester: str
    start_date: str
    end_date: str

class SchoolYearResponse(BaseModel):
    id: str
    user_id: str
    name: str
    semester: str
    start_date: str
    end_date: str
    created_at: str


@router.post("/school-years", response_model=SchoolYearResponse)
async def create_school_year(data: SchoolYearCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": data.name,
        "semester": data.semester,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.school_years.insert_one(doc)
    return SchoolYearResponse(**doc)


@router.get("/school-years", response_model=List[SchoolYearResponse])
async def get_school_years(user_id: str = Depends(get_current_user)):
    db = get_db()
    years = await db.school_years.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [SchoolYearResponse(**y) for y in years]


@router.delete("/school-years/{year_id}")
async def delete_school_year(year_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.school_years.delete_one({"id": year_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="School year not found")
    await db.class_subjects.delete_many({"school_year_id": year_id, "user_id": user_id})
    return {"status": "deleted"}
