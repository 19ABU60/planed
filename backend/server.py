from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.responses import StreamingResponse
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta, date
import jwt
import bcrypt
from io import BytesIO
import httpx
import asyncio

# Document exports
from docx import Document
from docx.shared import Inches, Pt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Set database for services module
from services.auth import set_database
set_database(db)

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'planed-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Invitation Code for Registration
INVITATION_CODE = os.environ.get('INVITATION_CODE', 'LASP2026')

# Create the main app
app = FastAPI(title="PlanEd API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== GERMAN SCHOOL HOLIDAYS DATA ==============
GERMAN_HOLIDAYS_2025_2026 = {
    "bayern": [
        {"name": "Herbstferien 2025", "start": "2025-10-27", "end": "2025-10-31"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-05"},
        {"name": "Winterferien 2026", "start": "2026-02-16", "end": "2026-02-20"},
        {"name": "Osterferien 2026", "start": "2026-03-30", "end": "2026-04-10"},
        {"name": "Pfingstferien 2026", "start": "2026-05-26", "end": "2026-06-05"},
        {"name": "Sommerferien 2026", "start": "2026-07-27", "end": "2026-09-07"},
    ],
    "nrw": [
        {"name": "Herbstferien 2025", "start": "2025-10-13", "end": "2025-10-25"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-06"},
        {"name": "Osterferien 2026", "start": "2026-03-30", "end": "2026-04-11"},
        {"name": "Pfingstferien 2026", "start": "2026-05-26", "end": "2026-05-26"},
        {"name": "Sommerferien 2026", "start": "2026-06-29", "end": "2026-08-11"},
    ],
    "berlin": [
        {"name": "Herbstferien 2025", "start": "2025-10-20", "end": "2025-11-01"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-02"},
        {"name": "Winterferien 2026", "start": "2026-02-02", "end": "2026-02-07"},
        {"name": "Osterferien 2026", "start": "2026-03-30", "end": "2026-04-10"},
        {"name": "Pfingstferien 2026", "start": "2026-05-15", "end": "2026-05-15"},
        {"name": "Sommerferien 2026", "start": "2026-07-09", "end": "2026-08-21"},
    ],
    "baden-wuerttemberg": [
        {"name": "Herbstferien 2025", "start": "2025-10-27", "end": "2025-10-30"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-05"},
        {"name": "Osterferien 2026", "start": "2026-04-06", "end": "2026-04-17"},
        {"name": "Pfingstferien 2026", "start": "2026-05-26", "end": "2026-06-06"},
        {"name": "Sommerferien 2026", "start": "2026-07-30", "end": "2026-09-12"},
    ],
    "hessen": [
        {"name": "Herbstferien 2025", "start": "2025-10-06", "end": "2025-10-18"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-10"},
        {"name": "Osterferien 2026", "start": "2026-04-06", "end": "2026-04-18"},
        {"name": "Sommerferien 2026", "start": "2026-07-06", "end": "2026-08-14"},
    ],
    "sachsen": [
        {"name": "Herbstferien 2025", "start": "2025-10-20", "end": "2025-11-01"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-03"},
        {"name": "Winterferien 2026", "start": "2026-02-09", "end": "2026-02-21"},
        {"name": "Osterferien 2026", "start": "2026-04-03", "end": "2026-04-11"},
        {"name": "Pfingstferien 2026", "start": "2026-05-15", "end": "2026-05-15"},
        {"name": "Sommerferien 2026", "start": "2026-06-27", "end": "2026-08-08"},
    ],
    "niedersachsen": [
        {"name": "Herbstferien 2025", "start": "2025-10-20", "end": "2025-10-31"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-05"},
        {"name": "Osterferien 2026", "start": "2026-03-23", "end": "2026-04-04"},
        {"name": "Pfingstferien 2026", "start": "2026-05-22", "end": "2026-05-22"},
        {"name": "Sommerferien 2026", "start": "2026-07-16", "end": "2026-08-26"},
    ],
    "hamburg": [
        {"name": "Herbstferien 2025", "start": "2025-10-20", "end": "2025-10-31"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-02"},
        {"name": "Frühjahrsferien 2026", "start": "2026-02-02", "end": "2026-02-13"},
        {"name": "Osterferien 2026", "start": "2026-03-06", "end": "2026-03-20"},
        {"name": "Pfingstferien 2026", "start": "2026-05-11", "end": "2026-05-15"},
        {"name": "Sommerferien 2026", "start": "2026-07-23", "end": "2026-09-02"},
    ],
    "rheinland-pfalz": [
        {"name": "Herbstferien 2025", "start": "2025-10-13", "end": "2025-10-24"},
        {"name": "Weihnachtsferien 2025/26", "start": "2025-12-22", "end": "2026-01-06"},
        {"name": "Osterferien 2026", "start": "2026-03-23", "end": "2026-04-06"},
        {"name": "Pfingstferien 2026", "start": "2026-06-02", "end": "2026-06-10"},
        {"name": "Sommerferien 2026", "start": "2026-07-06", "end": "2026-08-14"},
    ],
}

GERMAN_PUBLIC_HOLIDAYS_2025_2026 = [
    {"name": "Neujahr", "date": "2025-01-01"},
    {"name": "Karfreitag", "date": "2025-04-18"},
    {"name": "Ostermontag", "date": "2025-04-21"},
    {"name": "Tag der Arbeit", "date": "2025-05-01"},
    {"name": "Christi Himmelfahrt", "date": "2025-05-29"},
    {"name": "Pfingstmontag", "date": "2025-06-09"},
    {"name": "Tag der Deutschen Einheit", "date": "2025-10-03"},
    {"name": "1. Weihnachtstag", "date": "2025-12-25"},
    {"name": "2. Weihnachtstag", "date": "2025-12-26"},
    {"name": "Neujahr", "date": "2026-01-01"},
    {"name": "Karfreitag", "date": "2026-04-03"},
    {"name": "Ostermontag", "date": "2026-04-06"},
    {"name": "Tag der Arbeit", "date": "2026-05-01"},
    {"name": "Christi Himmelfahrt", "date": "2026-05-14"},
    {"name": "Pfingstmontag", "date": "2026-05-25"},
    {"name": "Tag der Deutschen Einheit", "date": "2026-10-03"},
    {"name": "1. Weihnachtstag", "date": "2026-12-25"},
    {"name": "2. Weihnachtstag", "date": "2026-12-26"},
]

BUNDESLAENDER = [
    {"id": "bayern", "name": "Bayern"},
    {"id": "nrw", "name": "Nordrhein-Westfalen"},
    {"id": "berlin", "name": "Berlin"},
    {"id": "baden-wuerttemberg", "name": "Baden-Württemberg"},
    {"id": "hessen", "name": "Hessen"},
    {"id": "sachsen", "name": "Sachsen"},
    {"id": "niedersachsen", "name": "Niedersachsen"},
    {"id": "hamburg", "name": "Hamburg"},
    {"id": "rheinland-pfalz", "name": "Rheinland-Pfalz"},
]

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    invitation_code: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str
    bundesland: Optional[str] = "rheinland-pfalz"
    theme: Optional[str] = "dark"

class UserSettingsUpdate(BaseModel):
    name: Optional[str] = None
    bundesland: Optional[str] = None
    theme: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

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

class ClassSubjectCreate(BaseModel):
    name: str
    subject: str
    color: str = "#3b82f6"
    hours_per_week: int = 4
    school_year_id: str
    schedule: Optional[Dict[str, List[int]]] = None  # e.g. {"monday": [3, 4], "wednesday": [1]}

class ClassSubjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    subject: str
    color: str
    hours_per_week: int
    school_year_id: str
    created_at: str
    schedule: Optional[Dict[str, List[int]]] = None

class LessonCreate(BaseModel):
    class_subject_id: str
    date: str
    period: Optional[int] = None  # Stundennummer (1-10)
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

class WorkplanEntry(BaseModel):
    date: str
    period: int
    unterrichtseinheit: Optional[str] = ""
    lehrplan: Optional[str] = ""
    stundenthema: Optional[str] = ""
    class_subject_id: Optional[str] = None

class WorkplanBulkSave(BaseModel):
    entries: List[WorkplanEntry]

class BatchLessonCreate(BaseModel):
    class_subject_id: str
    dates: List[str]
    topic: str = ""
    objective: str = ""
    curriculum_reference: str = ""
    teaching_units: int = 1

class HolidayCreate(BaseModel):
    school_year_id: str
    start_date: str
    end_date: str
    name: str

class HolidayResponse(BaseModel):
    id: str
    user_id: str
    school_year_id: str
    start_date: str
    end_date: str
    name: str

class StatisticsResponse(BaseModel):
    total_available_hours: int
    used_hours: int
    remaining_hours: int
    hours_by_weekday: Dict[str, int]
    cancelled_hours: int
    completion_percentage: float
    topics_covered: int
    hours_per_week: int
    school_weeks: int
    holiday_weeks: int
    semester_name: str
    upcoming_lessons: List[Dict[str, Any]] = []
    workplan_entries_count: int = 0

class AITopicSuggestionRequest(BaseModel):
    subject: str
    grade: str
    curriculum_topic: str
    previous_topics: List[str] = []

class AITopicSuggestionResponse(BaseModel):
    suggestions: List[Dict[str, str]]

# Sharing Models
class ShareCreate(BaseModel):
    class_subject_id: str
    shared_with_email: EmailStr
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

# Notification Models
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    class_name: str
    from_user_name: str
    is_read: bool
    created_at: str

# Template Models
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

# Comment Models
class CommentCreate(BaseModel):
    lesson_id: str
    text: str

class CommentResponse(BaseModel):
    id: str
    lesson_id: str
    user_id: str
    user_name: str
    text: str
    created_at: str

# To-Do Models
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

# History Models
class HistoryResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    created_at: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper to create notifications
async def create_notification(user_id: str, notification_type: str, title: str, message: str, class_name: str, from_user_name: str):
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
    return doc

# Helper to log history
async def log_history(user_id: str, action: str, entity_type: str, entity_id: str, details: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user.get("name", "Unbekannt") if user else "Unbekannt",
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.history.insert_one(doc)

# ============== AUTH ROUTES (ausgelagert nach routes/auth.py) ==============

# ============== GERMAN HOLIDAYS ROUTES ==============

@api_router.get("/holidays/bundeslaender")
async def get_bundeslaender():
    return BUNDESLAENDER

@api_router.get("/holidays/school-holidays/{bundesland}")
async def get_school_holidays(bundesland: str):
    if bundesland not in GERMAN_HOLIDAYS_2025_2026:
        raise HTTPException(status_code=404, detail="Bundesland nicht gefunden")
    return GERMAN_HOLIDAYS_2025_2026[bundesland]

@api_router.get("/holidays/public-holidays")
async def get_public_holidays():
    return GERMAN_PUBLIC_HOLIDAYS_2025_2026

# ============== SCHOOL YEAR ROUTES ==============

@api_router.post("/school-years", response_model=SchoolYearResponse)
async def create_school_year(data: SchoolYearCreate, user_id: str = Depends(get_current_user)):
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
    await log_history(user_id, "create", "school_year", doc["id"], f"Schuljahr {data.name} erstellt")
    return SchoolYearResponse(**doc)

@api_router.get("/school-years", response_model=List[SchoolYearResponse])
async def get_school_years(user_id: str = Depends(get_current_user)):
    years = await db.school_years.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [SchoolYearResponse(**y) for y in years]

@api_router.delete("/school-years/{year_id}")
async def delete_school_year(year_id: str, user_id: str = Depends(get_current_user)):
    result = await db.school_years.delete_one({"id": year_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="School year not found")
    await db.class_subjects.delete_many({"school_year_id": year_id, "user_id": user_id})
    return {"status": "deleted"}

# ============== CLASS/SUBJECT ROUTES ==============

@api_router.post("/classes", response_model=ClassSubjectResponse)
async def create_class(data: ClassSubjectCreate, user_id: str = Depends(get_current_user)):
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

@api_router.get("/classes", response_model=List[ClassSubjectResponse])
async def get_classes(school_year_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    if school_year_id:
        query["school_year_id"] = school_year_id
    classes = await db.class_subjects.find(query, {"_id": 0}).to_list(100)
    return [ClassSubjectResponse(**c) for c in classes]

@api_router.put("/classes/{class_id}", response_model=ClassSubjectResponse)
async def update_class(class_id: str, data: ClassSubjectCreate, user_id: str = Depends(get_current_user)):
    update_data = data.model_dump()
    result = await db.class_subjects.update_one(
        {"id": class_id, "user_id": user_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    updated = await db.class_subjects.find_one({"id": class_id}, {"_id": 0})
    return ClassSubjectResponse(**updated)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user_id: str = Depends(get_current_user)):
    result = await db.class_subjects.delete_one({"id": class_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.lessons.delete_many({"class_subject_id": class_id, "user_id": user_id})
    return {"status": "deleted"}

# ============== LESSON & WORKPLAN ROUTES (ausgelagert nach routes/lessons.py) ==============

# ============== TEMPLATE & TODO ROUTES (ausgelagert nach routes/templates_todos.py) ==============

# ============== COMMENT ROUTES ==============

@api_router.post("/comments", response_model=CommentResponse)
async def create_comment(data: CommentCreate, user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
    doc = {
        "id": str(uuid.uuid4()),
        "lesson_id": data.lesson_id,
        "user_id": user_id,
        "user_name": user.get("name", "Unbekannt") if user else "Unbekannt",
        "text": data.text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(doc)
    return CommentResponse(**doc)

@api_router.get("/comments/{lesson_id}", response_model=List[CommentResponse])
async def get_comments(lesson_id: str, user_id: str = Depends(get_current_user)):
    comments = await db.comments.find({"lesson_id": lesson_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [CommentResponse(**c) for c in comments]

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user_id: str = Depends(get_current_user)):
    result = await db.comments.delete_one({"id": comment_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kommentar nicht gefunden")
    return {"status": "deleted"}

# ============== HISTORY ROUTES ==============

@api_router.get("/history", response_model=List[HistoryResponse])
async def get_history(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user)
):
    query = {"user_id": user_id}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    history = await db.history.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [HistoryResponse(**h) for h in history]

@api_router.get("/history/class/{class_subject_id}", response_model=List[HistoryResponse])
async def get_class_history(class_subject_id: str, user_id: str = Depends(get_current_user)):
    """Get history for a specific class (including shared)"""
    # Get lessons for this class
    lessons = await db.lessons.find({"class_subject_id": class_subject_id}, {"id": 1, "_id": 0}).to_list(1000)
    lesson_ids = [l["id"] for l in lessons]
    
    history = await db.history.find({
        "$or": [
            {"entity_type": "class", "entity_id": class_subject_id},
            {"entity_type": "lesson", "entity_id": {"$in": lesson_ids}}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [HistoryResponse(**h) for h in history]

# ============== SEARCH ROUTES ==============

@api_router.get("/search")
async def global_search(q: str = Query(..., min_length=2), user_id: str = Depends(get_current_user)):
    """Search across lessons, classes, and templates"""
    results = {
        "lessons": [],
        "classes": [],
        "templates": [],
        "todos": []
    }
    
    # Search lessons
    lessons = await db.lessons.find({
        "user_id": user_id,
        "$or": [
            {"topic": {"$regex": q, "$options": "i"}},
            {"key_terms": {"$regex": q, "$options": "i"}},
            {"notes": {"$regex": q, "$options": "i"}}
        ]
    }, {"_id": 0}).limit(10).to_list(10)
    results["lessons"] = lessons
    
    # Search classes
    classes = await db.class_subjects.find({
        "user_id": user_id,
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"subject": {"$regex": q, "$options": "i"}}
        ]
    }, {"_id": 0}).limit(5).to_list(5)
    results["classes"] = classes
    
    # Search templates
    templates = await db.templates.find({
        "user_id": user_id,
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"topic": {"$regex": q, "$options": "i"}},
            {"subject": {"$regex": q, "$options": "i"}}
        ]
    }, {"_id": 0}).limit(5).to_list(5)
    results["templates"] = templates
    
    # Search todos
    todos = await db.todos.find({
        "user_id": user_id,
        "title": {"$regex": q, "$options": "i"}
    }, {"_id": 0}).limit(5).to_list(5)
    results["todos"] = todos
    
    return results

# ============== HOLIDAY ROUTES ==============

@api_router.post("/holidays", response_model=HolidayResponse)
async def create_holiday(data: HolidayCreate, user_id: str = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "school_year_id": data.school_year_id,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "name": data.name
    }
    await db.holidays.insert_one(doc)
    return HolidayResponse(**doc)

@api_router.get("/holidays", response_model=List[HolidayResponse])
async def get_holidays(school_year_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    if school_year_id:
        query["school_year_id"] = school_year_id
    holidays = await db.holidays.find(query, {"_id": 0}).to_list(100)
    return [HolidayResponse(**h) for h in holidays]

@api_router.delete("/holidays/{holiday_id}")
async def delete_holiday(holiday_id: str, user_id: str = Depends(get_current_user)):
    result = await db.holidays.delete_one({"id": holiday_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return {"status": "deleted"}

# ============== STATISTICS ROUTES (ausgelagert nach routes/statistics.py) ==============

# ============== EXPORT ROUTES ==============

@api_router.get("/export/excel/{class_subject_id}")
async def export_excel(class_subject_id: str, user_id: str = Depends(get_current_user)):
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    lessons = await db.lessons.find({"class_subject_id": class_subject_id, "user_id": user_id}, {"_id": 0}).sort("date", 1).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = f"{class_info['name']} - {class_info['subject']}"
    
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    headers = ["Datum", "Tag", "Ausfall", "Stundenthema", "Zielsetzung", "Lehrplan", "Begriffe", "UE"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
    
    weekday_names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    for row, lesson in enumerate(lessons, 2):
        date = datetime.fromisoformat(lesson["date"])
        ws.cell(row=row, column=1, value=date.strftime("%d.%m.%Y"))
        ws.cell(row=row, column=2, value=weekday_names[date.weekday()])
        ws.cell(row=row, column=3, value="x" if lesson["is_cancelled"] else "")
        ws.cell(row=row, column=4, value=lesson["topic"])
        ws.cell(row=row, column=5, value=lesson["objective"])
        ws.cell(row=row, column=6, value=lesson["curriculum_reference"])
        ws.cell(row=row, column=7, value=lesson["key_terms"])
        ws.cell(row=row, column=8, value=lesson["teaching_units"])
    
    for col in ws.columns:
        max_length = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_length + 2, 50)
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"Arbeitsplan_{class_info['name']}_{class_info['subject']}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/word/{class_subject_id}")
async def export_word(class_subject_id: str, user_id: str = Depends(get_current_user)):
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    school_year = await db.school_years.find_one({"id": class_info["school_year_id"]}, {"_id": 0})
    lessons = await db.lessons.find({"class_subject_id": class_subject_id, "user_id": user_id}, {"_id": 0}).sort("date", 1).to_list(1000)
    
    doc = Document()
    
    title = doc.add_heading(f"Arbeitsplan: {class_info['name']} - {class_info['subject']}", 0)
    if school_year:
        doc.add_paragraph(f"Schuljahr: {school_year['name']} ({school_year['semester']})")
    
    doc.add_paragraph("")
    
    table = doc.add_table(rows=1, cols=6)
    table.style = 'Table Grid'
    
    headers = ["Datum", "Thema", "Zielsetzung", "Lehrplan", "Begriffe", "UE"]
    header_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        header_cells[i].text = header
        header_cells[i].paragraphs[0].runs[0].bold = True
    
    weekday_names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    for lesson in lessons:
        row_cells = table.add_row().cells
        date = datetime.fromisoformat(lesson["date"])
        row_cells[0].text = f"{date.strftime('%d.%m')} ({weekday_names[date.weekday()]})"
        row_cells[1].text = lesson["topic"] + (" [AUSFALL]" if lesson["is_cancelled"] else "")
        row_cells[2].text = lesson["objective"]
        row_cells[3].text = lesson["curriculum_reference"]
        row_cells[4].text = lesson["key_terms"]
        row_cells[5].text = str(lesson["teaching_units"])
    
    output = BytesIO()
    doc.save(output)
    output.seek(0)
    
    filename = f"Arbeitsplan_{class_info['name']}_{class_info['subject']}.docx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/pdf/{class_subject_id}")
async def export_pdf(class_subject_id: str, user_id: str = Depends(get_current_user)):
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    lessons = await db.lessons.find({"class_subject_id": class_subject_id, "user_id": user_id}, {"_id": 0}).sort("date", 1).to_list(1000)
    
    output = BytesIO()
    c = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, height - 2*cm, f"Arbeitsplan: {class_info['name']} - {class_info['subject']}")
    
    y = height - 4*cm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, y, "Datum")
    c.drawString(4*cm, y, "Thema")
    c.drawString(12*cm, y, "UE")
    
    c.setFont("Helvetica", 9)
    y -= 0.7*cm
    
    weekday_names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    for lesson in lessons:
        if y < 2*cm:
            c.showPage()
            y = height - 2*cm
            c.setFont("Helvetica", 9)
        
        date = datetime.fromisoformat(lesson["date"])
        date_str = f"{date.strftime('%d.%m')} ({weekday_names[date.weekday()]})"
        topic = lesson["topic"][:50] + "..." if len(lesson["topic"]) > 50 else lesson["topic"]
        if lesson["is_cancelled"]:
            topic = "[AUSFALL] " + topic
        
        c.drawString(2*cm, y, date_str)
        c.drawString(4*cm, y, topic)
        c.drawString(12*cm, y, str(lesson["teaching_units"]))
        y -= 0.5*cm
    
    c.save()
    output.seek(0)
    
    filename = f"Arbeitsplan_{class_info['name']}_{class_info['subject']}.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============== IMPORT ROUTES ==============

@api_router.post("/import/excel/preview")
async def preview_excel_import(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Vorschau des Excel-Imports ohne zu speichern.
    Zeigt erkannte Spalten und Zeilen mit Beispieldaten.
    """
    from openpyxl import load_workbook
    
    try:
        contents = await file.read()
        wb = load_workbook(BytesIO(contents))
        ws = wb.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Lesen der Excel-Datei: {str(e)}")
    
    # Finde Header-Zeile und Spalten-Mapping
    header_row = 1
    headers = {}
    column_names = []
    
    for col in range(1, min(ws.max_column + 1, 20)):  # Max 20 Spalten
        cell_value = str(ws.cell(row=header_row, column=col).value or "").strip()
        cell_lower = cell_value.lower()
        column_names.append(cell_value)
        
        # Versuche Spaltentyp zu erkennen
        detected_type = None
        if "datum" in cell_lower or "date" in cell_lower:
            headers["date"] = col
            detected_type = "date"
        elif "thema" in cell_lower or "stundenthema" in cell_lower or "topic" in cell_lower:
            headers["topic"] = col
            detected_type = "topic"
        elif "ziel" in cell_lower or "objective" in cell_lower:
            headers["objective"] = col
            detected_type = "objective"
        elif "lehrplan" in cell_lower or "curriculum" in cell_lower or "standard" in cell_lower:
            headers["curriculum"] = col
            detected_type = "curriculum"
        elif "begriff" in cell_lower or "key" in cell_lower:
            headers["key_terms"] = col
            detected_type = "key_terms"
        elif "ue" in cell_lower or "einheit" in cell_lower or "stunden" in cell_lower:
            headers["teaching_units"] = col
            detected_type = "teaching_units"
        elif "ausfall" in cell_lower or "cancel" in cell_lower:
            headers["cancelled"] = col
            detected_type = "cancelled"
    
    # Lese Beispielzeilen (max 10)
    preview_rows = []
    row_count = 0
    valid_rows = 0
    
    for row in range(2, min(ws.max_row + 1, 52)):  # Max 50 Datenzeilen prüfen
        row_data = {}
        has_data = False
        
        for col in range(1, min(ws.max_column + 1, 20)):
            cell_value = ws.cell(row=row, column=col).value
            if cell_value is not None:
                has_data = True
                # Format datetime
                if isinstance(cell_value, datetime):
                    cell_value = cell_value.strftime("%d.%m.%Y")
                row_data[f"col_{col}"] = str(cell_value)[:100]  # Max 100 Zeichen
        
        if has_data:
            row_count += 1
            # Prüfe ob gültiges Datum
            if headers.get("date"):
                date_val = ws.cell(row=row, column=headers["date"]).value
                if date_val:
                    valid_rows += 1
            
            if len(preview_rows) < 10:
                preview_rows.append({
                    "row_number": row,
                    "data": row_data
                })
    
    # Erstelle Spalten-Info
    columns_info = []
    for idx, name in enumerate(column_names, 1):
        detected = None
        for key, col in headers.items():
            if col == idx:
                detected = key
                break
        columns_info.append({
            "column": idx,
            "name": name,
            "detected_as": detected
        })
    
    return {
        "file_name": file.filename,
        "total_rows": row_count,
        "valid_rows": valid_rows,
        "columns": columns_info,
        "detected_columns": {
            "date": headers.get("date"),
            "topic": headers.get("topic"),
            "objective": headers.get("objective"),
            "curriculum": headers.get("curriculum"),
            "key_terms": headers.get("key_terms"),
            "teaching_units": headers.get("teaching_units"),
            "cancelled": headers.get("cancelled")
        },
        "has_date_column": "date" in headers,
        "preview_rows": preview_rows
    }


@api_router.post("/import/excel/{class_subject_id}")
async def import_excel(
    class_subject_id: str, 
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Importiert einen Arbeitsplan aus einer Excel-Datei.
    Erwartet Spalten: Datum, Stundenthema, Zielsetzung, Lehrplan, Begriffe, UE, Ausfall
    """
    from openpyxl import load_workbook
    from io import BytesIO
    
    # Prüfe Klasse
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Klasse nicht gefunden")
    
    # Lese Excel-Datei
    try:
        contents = await file.read()
        wb = load_workbook(BytesIO(contents))
        ws = wb.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Lesen der Excel-Datei: {str(e)}")
    
    # Finde Header-Zeile und Spalten-Mapping
    header_row = 1
    headers = {}
    for col in range(1, ws.max_column + 1):
        cell_value = str(ws.cell(row=header_row, column=col).value or "").lower().strip()
        if "datum" in cell_value:
            headers["date"] = col
        elif "thema" in cell_value or "stundenthema" in cell_value:
            headers["topic"] = col
        elif "ziel" in cell_value:
            headers["objective"] = col
        elif "lehrplan" in cell_value or "curriculum" in cell_value:
            headers["curriculum"] = col
        elif "begriff" in cell_value or "key" in cell_value:
            headers["key_terms"] = col
        elif "ue" in cell_value or "einheit" in cell_value or "stunden" in cell_value:
            headers["teaching_units"] = col
        elif "ausfall" in cell_value or "cancel" in cell_value:
            headers["cancelled"] = col
    
    if "date" not in headers:
        raise HTTPException(status_code=400, detail="Spalte 'Datum' nicht gefunden. Bitte prüfen Sie die Excel-Datei.")
    
    # Importiere Zeilen
    imported = 0
    errors = []
    
    for row in range(2, ws.max_row + 1):
        date_cell = ws.cell(row=row, column=headers["date"]).value
        if not date_cell:
            continue
        
        # Parse Datum
        try:
            if isinstance(date_cell, datetime):
                date_str = date_cell.strftime("%Y-%m-%d")
            elif isinstance(date_cell, str):
                # Versuche verschiedene Formate
                for fmt in ["%d.%m.%Y", "%d.%m.%y", "%Y-%m-%d", "%d/%m/%Y"]:
                    try:
                        date_str = datetime.strptime(date_cell.strip(), fmt).strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
                else:
                    errors.append(f"Zeile {row}: Datum '{date_cell}' konnte nicht gelesen werden")
                    continue
            else:
                errors.append(f"Zeile {row}: Ungültiges Datumsformat")
                continue
        except Exception as e:
            errors.append(f"Zeile {row}: Fehler beim Parsen des Datums: {str(e)}")
            continue
        
        # Hole Werte aus anderen Spalten
        topic = str(ws.cell(row=row, column=headers.get("topic", 0)).value or "").strip() if headers.get("topic") else ""
        objective = str(ws.cell(row=row, column=headers.get("objective", 0)).value or "").strip() if headers.get("objective") else ""
        curriculum = str(ws.cell(row=row, column=headers.get("curriculum", 0)).value or "").strip() if headers.get("curriculum") else ""
        key_terms = str(ws.cell(row=row, column=headers.get("key_terms", 0)).value or "").strip() if headers.get("key_terms") else ""
        
        # Teaching Units
        teaching_units = 1
        if headers.get("teaching_units"):
            tu_val = ws.cell(row=row, column=headers["teaching_units"]).value
            if tu_val:
                try:
                    teaching_units = int(tu_val)
                except:
                    pass
        
        # Cancelled
        is_cancelled = False
        if headers.get("cancelled"):
            cancel_val = str(ws.cell(row=row, column=headers["cancelled"]).value or "").lower()
            is_cancelled = cancel_val in ["x", "ja", "yes", "1", "true", "ausfall"]
        
        # Prüfe ob Eintrag existiert
        existing = await db.lessons.find_one({
            "class_subject_id": class_subject_id,
            "user_id": user_id,
            "date": date_str
        })
        
        if existing:
            # Update existierenden Eintrag
            await db.lessons.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "topic": topic or existing.get("topic", ""),
                    "objective": objective or existing.get("objective", ""),
                    "curriculum_reference": curriculum or existing.get("curriculum_reference", ""),
                    "key_terms": key_terms or existing.get("key_terms", ""),
                    "teaching_units": teaching_units,
                    "is_cancelled": is_cancelled,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Erstelle neuen Eintrag
            lesson_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "class_subject_id": class_subject_id,
                "date": date_str,
                "period": None,
                "topic": topic,
                "objective": objective,
                "curriculum_reference": curriculum,
                "educational_standards": "",
                "key_terms": key_terms,
                "notes": "",
                "teaching_units": teaching_units,
                "is_cancelled": is_cancelled,
                "cancellation_reason": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.lessons.insert_one(lesson_doc)
        
        imported += 1
    
    return {
        "success": True,
        "imported": imported,
        "errors": errors[:10],  # Maximal 10 Fehler zurückgeben
        "total_errors": len(errors)
    }


# ============== AI SUGGESTIONS ROUTE ==============

@api_router.post("/ai/suggestions", response_model=AITopicSuggestionResponse)
async def get_ai_suggestions(data: AITopicSuggestionRequest, user_id: str = Depends(get_current_user)):
    import asyncio
    import json
    import re
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"planed-{user_id}-{uuid.uuid4()}",
            system_message="""Du bist ein erfahrener Lehrer und Lehrplanexperte. 
            Erstelle konkrete, praxisnahe Unterrichtsvorschläge basierend auf dem deutschen Lehrplan.
            Antworte immer auf Deutsch und strukturiere deine Vorschläge klar."""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Erstelle 3 Unterrichtsthemen-Vorschläge für:
        Fach: {data.subject}
        Klassenstufe: {data.grade}
        Lehrplanthema: {data.curriculum_topic}
        {"Bereits behandelte Themen: " + ", ".join(data.previous_topics[:3]) if data.previous_topics else ""}
        
        Antworte NUR mit einem JSON-Array: [{{"topic": "...", "objective": "...", "key_terms": "..."}}]"""
        
        try:
            response = await asyncio.wait_for(
                chat.send_message(UserMessage(text=prompt)),
                timeout=25.0
            )
        except asyncio.TimeoutError:
            return AITopicSuggestionResponse(suggestions=[
                {"topic": f"Einführung in {data.curriculum_topic}", "objective": "Grundlagen verstehen", "key_terms": data.subject},
                {"topic": f"Vertiefung: {data.curriculum_topic}", "objective": "Anwendung üben", "key_terms": "Übung, Praxis"},
                {"topic": f"Zusammenfassung {data.curriculum_topic}", "objective": "Wissen festigen", "key_terms": "Wiederholung"}
            ])
        
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            try:
                suggestions = json.loads(json_match.group())
            except json.JSONDecodeError:
                suggestions = [{"topic": "Vorschlag konnte nicht generiert werden", "objective": "", "key_terms": ""}]
        else:
            suggestions = [{"topic": "Vorschlag konnte nicht generiert werden", "objective": "", "key_terms": ""}]
        
        return AITopicSuggestionResponse(suggestions=suggestions[:5])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        return AITopicSuggestionResponse(suggestions=[
            {"topic": f"Thema zu {data.curriculum_topic}", "objective": "Lernziele definieren", "key_terms": data.subject}
        ])

# ============== DOCUMENT MANAGEMENT ==============

@api_router.post("/documents/upload")
async def upload_document(
    class_subject_id: str,
    lesson_id: Optional[str] = None,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    allowed_types = [".docx", ".doc", ".pdf", ".jpg", ".jpeg", ".png"]
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_types}")
    
    content = await file.read()
    
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "class_subject_id": class_subject_id,
        "lesson_id": lesson_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    
    return {"id": doc["id"], "filename": file.filename, "size": len(content)}

@api_router.get("/documents")
async def get_documents(
    class_subject_id: Optional[str] = None,
    lesson_id: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    query = {"user_id": user_id}
    if class_subject_id:
        query["class_subject_id"] = class_subject_id
    if lesson_id:
        query["lesson_id"] = lesson_id
    
    docs = await db.documents.find(query, {"_id": 0, "content": 0}).to_list(100)
    return docs

@api_router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str, user_id: str = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return StreamingResponse(
        BytesIO(doc["content"]),
        media_type=doc["content_type"],
        headers={"Content-Disposition": f"attachment; filename={doc['filename']}"}
    )

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user_id: str = Depends(get_current_user)):
    result = await db.documents.delete_one({"id": doc_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted"}

# ============== SHARING & NOTIFICATION ROUTES (ausgelagert nach routes/sharing.py) ==============

# ============== RESEARCH API (ausgelagert nach routes/research.py) ==============

# ============== LEHRPLAN-BASIERTE UNTERRICHTSPLANUNG ==============

# Import der Fach-Daten aus Modulen
from data.lehrplan_deutsch_rlp import LEHRPLAN_DEUTSCH_RLP
from data.schulbuecher_deutsch import SCHULBUECHER_DEUTSCH

# Pydantic Models für Unterrichtsplanung (bleiben hier wegen Abhängigkeiten)
# Pydantic Models für Unterrichtsplanung
class UnterrichtsreiheRequest(BaseModel):
    klassenstufe: str
    kompetenzbereich: str
    thema_id: str
    niveau: str  # G, M, E
    stunden_anzahl: int = 6
    schulbuch_id: Optional[str] = None  # Optional: Schulbuch-Referenz

class MaterialRequest(BaseModel):
    thema: str
    niveau: str
    material_typ: str  # arbeitsblatt, quiz, raetsel, zuordnung
    klassenstufe: str

class GeneratedMaterial(BaseModel):
    typ: str
    titel: str
    inhalt: str
    loesung: Optional[str] = None

# API Endpoints


# ============== IMPORT AUSGELAGERTER MODULE ==============
from routes.faecher.deutsch import router as deutsch_router
from routes.faecher.mathe import router as mathe_router
from routes.auth import router as auth_router
from routes.lessons import router as lessons_router
from routes.templates_todos import router as templates_todos_router
from routes.statistics import router as statistics_router
from routes.sharing import router as sharing_router
from routes.research import router as research_router

# Include routers
app.include_router(deutsch_router)
app.include_router(mathe_router)
app.include_router(auth_router)
app.include_router(lessons_router)
app.include_router(templates_todos_router)
app.include_router(statistics_router)
app.include_router(sharing_router)
app.include_router(research_router)

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "PlanEd API v2.1.0 - Modular", "status": "running"}

# Include the main router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
