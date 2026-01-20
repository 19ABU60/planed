# Classes Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.schemas import ClassSubjectCreate, ClassSubjectResponse
from services.auth import get_db, get_current_user, log_history

router = APIRouter(prefix="/api", tags=["classes"])


@router.post("/classes", response_model=ClassSubjectResponse)
async def create_class(data: ClassSubjectCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": data.name,
        "subject": data.subject,
        "color": data.color,
        "hours_per_week": data.hours_per_week,
        "school_year_id": data.school_year_id,
        "schedule": data.schedule or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.class_subjects.insert_one(doc)
    await log_history(user_id, "create", "class", doc["id"], f"Klasse {data.name} - {data.subject} erstellt")
    return ClassSubjectResponse(**doc)


@router.get("/classes", response_model=List[ClassSubjectResponse])
async def get_classes(school_year_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    db = get_db()
    query = {"user_id": user_id}
    if school_year_id:
        query["school_year_id"] = school_year_id
    classes = await db.class_subjects.find(query, {"_id": 0}).to_list(100)
    return [ClassSubjectResponse(**c) for c in classes]


@router.put("/classes/{class_id}", response_model=ClassSubjectResponse)
async def update_class(class_id: str, data: ClassSubjectCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    update_data = data.model_dump()
    result = await db.class_subjects.update_one(
        {"id": class_id, "user_id": user_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    updated = await db.class_subjects.find_one({"id": class_id}, {"_id": 0})
    return ClassSubjectResponse(**updated)


@router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.class_subjects.delete_one({"id": class_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.lessons.delete_many({"class_subject_id": class_id, "user_id": user_id})
    return {"status": "deleted"}
