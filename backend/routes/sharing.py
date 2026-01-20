# Sharing & Notifications Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["sharing", "notifications"])


# ============== PYDANTIC MODELS ==============

class ShareCreate(BaseModel):
    class_subject_id: str
    shared_with_email: str
    can_edit: bool = False

class ShareResponse(BaseModel):
    id: str
    class_subject_id: str
    owner_id: str
    owner_name: str
    shared_with_id: str
    shared_with_email: str
    can_edit: bool
    created_at: str

class SharedClassResponse(BaseModel):
    id: str
    name: str
    subject: str
    color: str
    hours_per_week: int
    school_year_id: str
    owner_name: str
    owner_email: str
    can_edit: bool

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    class_name: Optional[str] = None
    from_user_name: Optional[str] = None
    is_read: bool
    created_at: str


# ============== HELPER FUNCTIONS ==============

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


# ============== SHARING ROUTES ==============

@router.post("/shares", response_model=ShareResponse)
async def share_class(data: ShareCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    class_info = await db.class_subjects.find_one({"id": data.class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    target_user = await db.users.find_one({"email": data.shared_with_email}, {"_id": 0, "password": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Benutzer mit dieser E-Mail nicht gefunden")
    
    if target_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Sie können nicht mit sich selbst teilen")
    
    existing = await db.shares.find_one({
        "class_subject_id": data.class_subject_id,
        "shared_with_id": target_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bereits mit diesem Benutzer geteilt")
    
    owner = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    share_doc = {
        "id": str(uuid.uuid4()),
        "class_subject_id": data.class_subject_id,
        "owner_id": user_id,
        "owner_name": owner["name"],
        "shared_with_id": target_user["id"],
        "shared_with_email": data.shared_with_email,
        "can_edit": data.can_edit,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shares.insert_one(share_doc)
    
    class_display = f"{class_info['name']} - {class_info['subject']}"
    permission = "Bearbeitung" if data.can_edit else "Nur Ansicht"
    await create_notification(
        user_id=target_user["id"],
        notification_type="share_new",
        title="Neuer Arbeitsplan geteilt",
        message=f"{owner['name']} hat den Arbeitsplan '{class_display}' mit Ihnen geteilt ({permission})",
        class_name=class_display,
        from_user_name=owner["name"]
    )
    
    return ShareResponse(**share_doc)


@router.get("/shares/my-shares", response_model=List[ShareResponse])
async def get_my_shares(user_id: str = Depends(get_current_user)):
    db = get_db()
    shares = await db.shares.find({"owner_id": user_id}, {"_id": 0}).to_list(100)
    return [ShareResponse(**s) for s in shares]


@router.get("/shares/shared-with-me", response_model=List[SharedClassResponse])
async def get_shared_with_me(user_id: str = Depends(get_current_user)):
    db = get_db()
    shares = await db.shares.find({"shared_with_id": user_id}, {"_id": 0}).to_list(100)
    
    shared_classes = []
    for share in shares:
        class_info = await db.class_subjects.find_one({"id": share["class_subject_id"]}, {"_id": 0})
        if class_info:
            owner = await db.users.find_one({"id": share["owner_id"]}, {"_id": 0, "password": 0})
            shared_classes.append(SharedClassResponse(
                id=class_info["id"],
                name=class_info["name"],
                subject=class_info["subject"],
                color=class_info["color"],
                hours_per_week=class_info["hours_per_week"],
                school_year_id=class_info["school_year_id"],
                owner_name=owner["name"] if owner else "Unbekannt",
                owner_email=owner["email"] if owner else "",
                can_edit=share["can_edit"]
            ))
    
    return shared_classes


@router.delete("/shares/{share_id}")
async def remove_share(share_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.shares.delete_one({"id": share_id, "owner_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Freigabe nicht gefunden")
    return {"status": "deleted"}


@router.get("/shares/class/{class_subject_id}", response_model=List[ShareResponse])
async def get_class_shares(class_subject_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    shares = await db.shares.find({"class_subject_id": class_subject_id}, {"_id": 0}).to_list(100)
    return [ShareResponse(**s) for s in shares]


# ============== NOTIFICATION ROUTES ==============

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user_id: str = Depends(get_current_user)):
    db = get_db()
    notifications = await db.notifications.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]


@router.get("/notifications/unread-count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    db = get_db()
    count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
    return {"count": count}


@router.put("/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Benachrichtigung nicht gefunden")
    return {"status": "read"}


@router.put("/notifications/read-all")
async def mark_all_as_read(user_id: str = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"status": "all_read"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.notifications.delete_one({"id": notification_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Benachrichtigung nicht gefunden")
    return {"status": "deleted"}
