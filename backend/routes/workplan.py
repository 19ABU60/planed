# Workplan Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from services.auth import get_db, get_current_user, log_history

router = APIRouter(prefix="/api", tags=["workplan"])


# Pydantic Models
from pydantic import BaseModel

class WorkplanEntry(BaseModel):
    date: str
    period: int
    unterrichtseinheit: Optional[str] = ""
    lehrplan: Optional[str] = ""
    stundenthema: Optional[str] = ""
    class_subject_id: Optional[str] = None

class WorkplanBulkSave(BaseModel):
    entries: List[WorkplanEntry]


@router.get("/workplan/{class_subject_id}")
async def get_workplan(
    class_subject_id: str, 
    start: str = None, 
    end: str = None, 
    user_id: str = Depends(get_current_user)
):
    """Gibt den Arbeitsplan für eine Klasse zurück"""
    db = get_db()
    query = {"class_subject_id": class_subject_id}
    
    if start and end:
        query["date"] = {"$gte": start, "$lte": end}
    
    entries = await db.workplan_entries.find(query, {"_id": 0}).to_list(1000)
    return entries


@router.post("/workplan/{class_subject_id}")
async def save_workplan_entry(
    class_subject_id: str, 
    entry: WorkplanEntry, 
    user_id: str = Depends(get_current_user)
):
    """Speichert oder aktualisiert einen Arbeitsplan-Eintrag"""
    db = get_db()
    
    # Prüfe ob Eintrag existiert
    existing = await db.workplan_entries.find_one({
        "class_subject_id": class_subject_id,
        "date": entry.date,
        "period": entry.period
    })
    
    if existing:
        # Update
        await db.workplan_entries.update_one(
            {"class_subject_id": class_subject_id, "date": entry.date, "period": entry.period},
            {"$set": {
                "unterrichtseinheit": entry.unterrichtseinheit,
                "lehrplan": entry.lehrplan,
                "stundenthema": entry.stundenthema,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": user_id
            }}
        )
    else:
        # Insert
        doc = {
            "id": str(uuid.uuid4()),
            "class_subject_id": class_subject_id,
            "date": entry.date,
            "period": entry.period,
            "unterrichtseinheit": entry.unterrichtseinheit,
            "lehrplan": entry.lehrplan,
            "stundenthema": entry.stundenthema,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": user_id
        }
        await db.workplan_entries.insert_one(doc)
    
    return {"success": True}


@router.post("/workplan/{class_subject_id}/bulk")
async def bulk_save_workplan(
    class_subject_id: str, 
    data: WorkplanBulkSave, 
    user_id: str = Depends(get_current_user)
):
    """Speichert mehrere Arbeitsplan-Einträge auf einmal"""
    db = get_db()
    saved = 0
    
    for entry in data.entries:
        existing = await db.workplan_entries.find_one({
            "class_subject_id": class_subject_id,
            "date": entry.date,
            "period": entry.period
        })
        
        if existing:
            await db.workplan_entries.update_one(
                {"class_subject_id": class_subject_id, "date": entry.date, "period": entry.period},
                {"$set": {
                    "unterrichtseinheit": entry.unterrichtseinheit,
                    "lehrplan": entry.lehrplan,
                    "stundenthema": entry.stundenthema,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_by": user_id
                }}
            )
        else:
            doc = {
                "id": str(uuid.uuid4()),
                "class_subject_id": class_subject_id,
                "date": entry.date,
                "period": entry.period,
                "unterrichtseinheit": entry.unterrichtseinheit,
                "lehrplan": entry.lehrplan,
                "stundenthema": entry.stundenthema,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": user_id
            }
            await db.workplan_entries.insert_one(doc)
        saved += 1
    
    await log_history(user_id, "bulk_create", "workplan", class_subject_id, f"{saved} Einträge gespeichert")
    
    return {"success": True, "saved": saved}
