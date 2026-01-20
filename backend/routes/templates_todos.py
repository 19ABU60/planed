# Templates & Todos Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["templates", "todos"])


# ============== PYDANTIC MODELS ==============

class TemplateCreate(BaseModel):
    name: str
    subject: str
    topic: str
    objective: str = ""
    curriculum_reference: str = ""
    educational_standards: str = ""
    key_terms: str = ""
    notes: str = ""
    teaching_units: int = 1

class TemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    subject: str
    topic: str
    objective: str
    curriculum_reference: str
    educational_standards: str
    key_terms: str
    notes: str
    teaching_units: int
    created_at: str
    use_count: int

class TodoCreate(BaseModel):
    title: str
    description: str = ""
    due_date: Optional[str] = None
    class_subject_id: Optional[str] = None
    lesson_id: Optional[str] = None
    priority: str = "medium"

class TodoResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    due_date: Optional[str]
    class_subject_id: Optional[str]
    lesson_id: Optional[str]
    priority: str
    is_completed: bool
    created_at: str

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None


# ============== TEMPLATE ROUTES ==============

@router.post("/templates", response_model=TemplateResponse)
async def create_template(data: TemplateCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": data.name,
        "subject": data.subject,
        "topic": data.topic,
        "objective": data.objective,
        "curriculum_reference": data.curriculum_reference,
        "educational_standards": data.educational_standards,
        "key_terms": data.key_terms,
        "notes": data.notes,
        "teaching_units": data.teaching_units,
        "use_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.templates.insert_one(doc)
    return TemplateResponse(**doc)


@router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(subject: Optional[str] = None, user_id: str = Depends(get_current_user)):
    db = get_db()
    query = {"user_id": user_id}
    if subject:
        query["subject"] = subject
    templates = await db.templates.find(query, {"_id": 0}).sort("use_count", -1).to_list(100)
    return [TemplateResponse(**t) for t in templates]


@router.post("/templates/{template_id}/use", response_model=TemplateResponse)
async def use_template(template_id: str, user_id: str = Depends(get_current_user)):
    """Increment use count and return template"""
    db = get_db()
    await db.templates.update_one(
        {"id": template_id, "user_id": user_id},
        {"$inc": {"use_count": 1}}
    )
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Vorlage nicht gefunden")
    return TemplateResponse(**template)


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.templates.delete_one({"id": template_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vorlage nicht gefunden")
    return {"status": "deleted"}


# ============== TODO ROUTES ==============

@router.post("/todos", response_model=TodoResponse)
async def create_todo(data: TodoCreate, user_id: str = Depends(get_current_user)):
    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": data.title,
        "description": data.description,
        "due_date": data.due_date,
        "class_subject_id": data.class_subject_id,
        "lesson_id": data.lesson_id,
        "priority": data.priority,
        "is_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.todos.insert_one(doc)
    return TodoResponse(**doc)


@router.get("/todos", response_model=List[TodoResponse])
async def get_todos(
    completed: Optional[bool] = None,
    class_subject_id: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": user_id}
    if completed is not None:
        query["is_completed"] = completed
    if class_subject_id:
        query["class_subject_id"] = class_subject_id
    todos = await db.todos.find(query, {"_id": 0}).sort("due_date", 1).to_list(100)
    return [TodoResponse(**t) for t in todos]


@router.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, data: TodoUpdate, user_id: str = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.todos.update_one(
        {"id": todo_id, "user_id": user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    updated = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    return TodoResponse(**updated)


@router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    result = await db.todos.delete_one({"id": todo_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return {"status": "deleted"}
