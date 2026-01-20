# Pydantic Models for PlanEd
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any


# ============== AUTH MODELS ==============

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


# ============== SCHOOL YEAR MODELS ==============

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


# ============== CLASS/SUBJECT MODELS ==============

class ClassSubjectCreate(BaseModel):
    name: str
    subject: str
    color: str = "#3b82f6"
    hours_per_week: int = 4
    school_year_id: str
    schedule: Optional[Dict[str, List[int]]] = None

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


# ============== LESSON MODELS ==============

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


# ============== WORKPLAN MODELS ==============

class WorkplanEntry(BaseModel):
    date: str
    period: int
    unterrichtseinheit: Optional[str] = ""
    lehrplan: Optional[str] = ""
    stundenthema: Optional[str] = ""
    class_subject_id: Optional[str] = None

class WorkplanBulkSave(BaseModel):
    entries: List[WorkplanEntry]


# ============== HOLIDAY MODELS ==============

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


# ============== STATISTICS MODELS ==============

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


# ============== AI MODELS ==============

class AITopicSuggestionRequest(BaseModel):
    subject: str
    grade: str
    curriculum_topic: str
    previous_topics: List[str] = []

class AITopicSuggestionResponse(BaseModel):
    suggestions: List[Dict[str, str]]


# ============== SHARING MODELS ==============

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


# ============== NOTIFICATION MODELS ==============

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


# ============== TEMPLATE MODELS ==============

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


# ============== COMMENT MODELS ==============

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


# ============== TODO MODELS ==============

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


# ============== HISTORY MODELS ==============

class HistoryResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    created_at: str


# ============== UNTERRICHTSPLANUNG MODELS (Deutsch) ==============

class UnterrichtsreiheRequest(BaseModel):
    klassenstufe: str
    kompetenzbereich: str
    thema_id: str
    niveau: str  # G, M, E
    stunden_anzahl: int = 6
    schulbuch_id: Optional[str] = None

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

class SaveUnterrichtsreiheRequest(BaseModel):
    title: str
    unterrichtsreihe: Dict[str, Any]
    klassenstufe: Optional[str] = None
    thema_id: Optional[str] = None
    niveau: Optional[str] = None
    schulbuch_id: Optional[str] = None
