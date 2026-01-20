# Auth Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from models.schemas import UserCreate, UserLogin, UserResponse, UserSettingsUpdate, TokenResponse
from services.auth import (
    get_db, get_current_user, hash_password, verify_password, create_token, INVITATION_CODE
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    db = get_db()
    # Verify invitation code
    if user.invitation_code != INVITATION_CODE:
        raise HTTPException(status_code=403, detail="Ungültiger Einladungs-Code")
    
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "bundesland": "rheinland-pfalz",
        "theme": "dark",
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name, created_at=now, bundesland="rheinland-pfalz", theme="dark")
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"], 
            email=user["email"], 
            name=user["name"], 
            created_at=user["created_at"],
            bundesland=user.get("bundesland", "rheinland-pfalz"),
            theme=user.get("theme", "dark")
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)


@router.put("/settings", response_model=UserResponse)
async def update_settings(data: UserSettingsUpdate, user_id: str = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**user)
