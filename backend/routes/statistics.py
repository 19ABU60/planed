# Statistics Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["statistics"])


# ============== PYDANTIC MODELS ==============

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
    upcoming_lessons: List[Dict[str, Any]]
    workplan_entries_count: int


# ============== STATISTICS ROUTES ==============

@router.get("/statistics/{class_subject_id}", response_model=StatisticsResponse)
async def get_statistics(class_subject_id: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    class_info = await db.class_subjects.find_one({"id": class_subject_id, "user_id": user_id}, {"_id": 0})
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    school_year = await db.school_years.find_one({"id": class_info["school_year_id"]}, {"_id": 0})
    if not school_year:
        raise HTTPException(status_code=404, detail="School year not found")
    
    # Calculate hours per week from schedule
    schedule = class_info.get("schedule", {})
    hours_per_week = 0
    for day, periods in schedule.items():
        if isinstance(periods, list):
            hours_per_week += len(periods)
    
    if hours_per_week == 0:
        hours_per_week = class_info.get("hours_per_week", 3)
    
    # Calculate school weeks
    start = datetime.fromisoformat(school_year["start_date"])
    end = datetime.fromisoformat(school_year["end_date"])
    total_weeks = (end - start).days // 7
    
    # Get holidays
    holidays = await db.holidays.find({
        "user_id": user_id,
        "school_year_id": school_year["id"]
    }, {"_id": 0}).to_list(100)
    
    holiday_days = 0
    for holiday in holidays:
        h_start = datetime.fromisoformat(holiday["start_date"])
        h_end = datetime.fromisoformat(holiday["end_date"])
        holiday_days += (h_end - h_start).days + 1
    holiday_weeks = holiday_days // 7
    
    school_weeks = total_weeks - holiday_weeks
    total_available = school_weeks * hours_per_week
    
    # Get lessons
    lessons = await db.lessons.find({"class_subject_id": class_subject_id, "user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Get workplan entries
    workplan_entries = await db.workplan.find({"class_subject_id": class_subject_id}, {"_id": 0}).to_list(1000)
    workplan_with_content = [w for w in workplan_entries if w.get("unterrichtseinheit") or w.get("lehrplan") or w.get("stundenthema")]
    
    # Count used hours
    lesson_dates_periods = set()
    for l in lessons:
        if not l.get("is_cancelled", False):
            key = f"{l['date']}-{l.get('period', 0)}"
            lesson_dates_periods.add(key)
    
    used_hours = len(lesson_dates_periods)
    
    for w in workplan_with_content:
        key = f"{w['date']}-{w.get('period', 0)}"
        if key not in lesson_dates_periods:
            used_hours += 1
    
    cancelled_hours = len([l for l in lessons if l.get("is_cancelled", False)])
    
    # Count topics
    unterrichtseinheiten = set()
    for w in workplan_with_content:
        if w.get("unterrichtseinheit"):
            unterrichtseinheiten.add(w["unterrichtseinheit"].strip().lower())
    for l in lessons:
        if l.get("topic") and not l.get("is_cancelled", False):
            unterrichtseinheiten.add(l["topic"].strip().lower())
    topics_covered = len(unterrichtseinheiten)
    
    # Hours by weekday
    weekday_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    hours_by_weekday = {day: 0 for day in weekday_names}
    
    for lesson in lessons:
        if not lesson.get("is_cancelled", False):
            try:
                date = datetime.fromisoformat(lesson["date"])
                weekday = weekday_names[date.weekday()]
                hours_by_weekday[weekday] += 1
            except:
                pass
    
    for wp in workplan_with_content:
        try:
            date = datetime.fromisoformat(wp["date"])
            weekday = weekday_names[date.weekday()]
            hours_by_weekday[weekday] += 1
        except:
            pass
    
    completion_percentage = (used_hours / total_available * 100) if total_available > 0 else 0
    
    # Upcoming lessons
    today = datetime.now(timezone.utc).date().isoformat()
    all_entries = []
    
    for l in lessons:
        if l["date"] >= today and not l.get("is_cancelled", False):
            all_entries.append({
                "date": l["date"],
                "period": l.get("period"),
                "topic": l.get("topic", ""),
                "source": "lesson"
            })
    for w in workplan_with_content:
        if w["date"] >= today:
            all_entries.append({
                "date": w["date"],
                "period": w.get("period"),
                "topic": w.get("unterrichtseinheit", ""),
                "source": "workplan"
            })
    
    all_entries.sort(key=lambda x: (x["date"], x.get("period") or 99))
    upcoming = all_entries[:5]
    
    return StatisticsResponse(
        total_available_hours=total_available,
        used_hours=used_hours,
        remaining_hours=max(0, total_available - used_hours - cancelled_hours),
        hours_by_weekday=hours_by_weekday,
        cancelled_hours=cancelled_hours,
        completion_percentage=round(min(100, completion_percentage), 1),
        topics_covered=topics_covered,
        hours_per_week=hours_per_week,
        school_weeks=school_weeks,
        holiday_weeks=holiday_weeks,
        semester_name=school_year.get("semester", school_year.get("name", "Schuljahr")),
        upcoming_lessons=upcoming,
        workplan_entries_count=len(workplan_with_content)
    )
