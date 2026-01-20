# Lessons Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["lessons"])


# ============== PYDANTIC MODELS ==============

class LessonCreate(BaseModel):
    class_subject_id: str
    date: str
    period: Optional[int] = None
    topic: str = ""
    objective: str = ""
    curriculum_reference: str = ""
    educational_standards: str = ""
    key_terms: str = ""
    notes: str = ""
    teaching_units: int = 1
    is_cancelled: bool = False
    cancellation_reason: str = ""

class LessonResponse(BaseModel):
    id: str
    user_id: str
    class_subject_id: str
    date: str
    period: Optional[int] = None
    topic: str
    objective: str
    curriculum_reference: str
    educational_standards: str
    key_terms: str
    notes: str
    teaching_units: int
    is_cancelled: bool
    cancellation_reason: str
    created_at: str
    updated_at: str

class LessonUpdate(BaseModel):
    topic: Optional[str] = None
    objective: Optional[str] = None
    curriculum_reference: Optional[str] = None
    educational_standards: Optional[str] = None
    key_terms: Optional[str] = None
    notes: Optional[str] = None
    teaching_units: Optional[int] = None
    is_cancelled: Optional[bool] = None
    cancellation_reason: Optional[str] = None
    date: Optional[str] = None
    period: Optional[int] = None

class BatchLessonCreate(BaseModel):
    class_subject_id: str
    dates: List[str]
    topic: str = ""
    objective: str = ""
    curriculum_reference: str = ""
    teaching_units: int = 1

class WorkplanEntry(BaseModel):
    date: str
    period: int
    unterrichtseinheit: Optional[str] = ""
    lehrplan: Optional[str] = ""
    stundenthema: Optional[str] = ""
    class_subject_id: Optional[str] = None

class WorkplanBulkSave(BaseModel):
    entries: List[WorkplanEntry]


# ============== HELPER FUNCTIONS ==============

async def log_history(user_id: str, action: str, entity_type: str, entity_id: str, description: str):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.history.insert_one(doc)

async def create_notification(user_id: str, notification_type: str, title: str, message: str, 
                              class_name: str = None, from_user_name: str = None):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "class_name": class_name,
        "from_user_name": from_user_name,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(doc)


# ============== LESSON ROUTES ==============

@router.post("/lessons", response_model=LessonResponse)
async def create_lesson(data: LessonCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "class_subject_id": data.class_subject_id,
        "date": data.date,
        "period": data.period,
        "topic": data.topic,
        "objective": data.objective,
        "curriculum_reference": data.curriculum_reference,
        "educational_standards": data.educational_standards,
        "key_terms": data.key_terms,
        "notes": data.notes,
        "teaching_units": data.teaching_units,
        "is_cancelled": data.is_cancelled,
        "cancellation_reason": data.cancellation_reason,
        "created_at": now,
        "updated_at": now
    }
    await db.lessons.insert_one(doc)
    
    class_info = await db.class_subjects.find_one({"id": data.class_subject_id}, {"_id": 0})
    if class_info:
        period_str = f" ({data.period}. Std.)" if data.period else ""
        await log_history(user_id, "create", "lesson", doc["id"], 
                         f"Stunde am {data.date}{period_str} für {class_info['name']} erstellt")
    
    return LessonResponse(**doc)


@router.post("/lessons/batch", response_model=List[LessonResponse])
async def create_batch_lessons(data: BatchLessonCreate, user_id: str = Depends(get_current_user)):
    """Create multiple lessons at once"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    lessons = []
    
    for date_str in data.dates:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "class_subject_id": data.class_subject_id,
            "date": date_str,
            "topic": data.topic,
            "objective": data.objective,
            "curriculum_reference": data.curriculum_reference,
            "educational_standards": "",
            "key_terms": "",
            "notes": "",
            "teaching_units": data.teaching_units,
            "is_cancelled": False,
            "cancellation_reason": "",
            "created_at": now,
            "updated_at": now
        }
        await db.lessons.insert_one(doc)
        lessons.append(LessonResponse(**doc))
    
    return lessons


@router.get("/lessons", response_model=List[LessonResponse])
async def get_lessons(
    class_subject_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": user_id}
    if class_subject_id:
        query["class_subject_id"] = class_subject_id
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    lessons = await db.lessons.find(query, {"_id": 0}).sort("date", 1).to_list(1000)
    return [LessonResponse(**l) for l in lessons]


@router.post("/lessons/{lesson_id}/copy", response_model=LessonResponse)
async def copy_lesson(lesson_id: str, new_date: str = Query(...), user_id: str = Depends(get_current_user)):
    """Copy an existing lesson to a new date"""
    db = get_db()
    original = await db.lessons.find_one({"id": lesson_id, "user_id": user_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Stunde nicht gefunden")
    
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **original,
        "id": str(uuid.uuid4()),
        "date": new_date,
        "created_at": now,
        "updated_at": now
    }
    await db.lessons.insert_one(doc)
    return LessonResponse(**doc)


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(lesson_id: str, data: LessonUpdate, user_id: str = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.lessons.update_one(
        {"id": lesson_id, "user_id": user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Stunde nicht gefunden")
    updated = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    
    # Send notifications to shared users
    class_info = await db.class_subjects.find_one({"id": updated["class_subject_id"]}, {"_id": 0})
    if class_info:
        shares = await db.shares.find({"class_subject_id": updated["class_subject_id"]}, {"_id": 0}).to_list(100)
        current_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        class_display = f"{class_info['name']} - {class_info['subject']}"
        
        for share in shares:
            await create_notification(
                user_id=share["shared_with_id"],
                notification_type="share_edit",
                title="Arbeitsplan aktualisiert",
                message=f"{current_user['name']} hat eine Stunde im Arbeitsplan '{class_display}' geändert",
                class_name=class_display,
                from_user_name=current_user["name"]
            )
        
        await log_history(user_id, "update", "lesson", lesson_id, f"Stunde am {updated['date']} bearbeitet")
    
    return LessonResponse(**updated)


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.lessons.delete_one({"id": lesson_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stunde nicht gefunden")
    return {"status": "deleted"}


# ============== WORKPLAN ROUTES ==============

@router.get("/workplan/{class_id}")
async def get_workplan(
    class_id: str,
    start: str = Query(...),
    end: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """Get workplan entries for a class in date range"""
    db = get_db()
    query = {
        "class_subject_id": class_id,
        "date": {"$gte": start, "$lte": end}
    }
    entries = await db.workplan.find(query, {"_id": 0}).sort([("date", 1), ("period", 1)]).to_list(1000)
    return entries


@router.post("/workplan/{class_id}/bulk")
async def save_workplan_bulk(
    class_id: str,
    data: WorkplanBulkSave,
    user_id: str = Depends(get_current_user)
):
    """Save multiple workplan entries at once"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    for entry in data.entries:
        filter_query = {
            "class_subject_id": class_id,
            "date": entry.date,
            "period": entry.period
        }
        
        update_doc = {
            "$set": {
                "class_subject_id": class_id,
                "date": entry.date,
                "period": entry.period,
                "unterrichtseinheit": entry.unterrichtseinheit or "",
                "lehrplan": entry.lehrplan or "",
                "stundenthema": entry.stundenthema or "",
                "updated_at": now,
                "updated_by": user_id
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "created_at": now,
                "created_by": user_id
            }
        }
        
        await db.workplan.update_one(filter_query, update_doc, upsert=True)
    
    return {"status": "success", "count": len(data.entries)}
