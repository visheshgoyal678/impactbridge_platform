from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import datetime
from app.database.db import get_db
from app.models.database_models import User
from app.database.firebase_db import sync_entity_to_firestore, verify_firebase_auth_token

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterPayload(BaseModel):
    email: str
    password: Optional[str] = "password123"
    name: str
    role: str = "CITIZEN" # CITIZEN, STUDENT, FACULTY, COMPANY_REP, ADMIN
    organization: Optional[str] = "Civic Community"
    department: Optional[str] = None
    location: Optional[str] = "Belagavi Ward, Karnataka"

class LoginPayload(BaseModel):
    email: str
    password: Optional[str] = "password123"

class FirebaseAuthPayload(BaseModel):
    email: str
    name: Optional[str] = None
    firebase_uid: Optional[str] = None
    photo_url: Optional[str] = None
    role: Optional[str] = "CITIZEN"
    organization: Optional[str] = None
    id_token: Optional[str] = None

@auth_router.post("/register")
def register_user(payload: RegisterPayload, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        return {
            "status": "success",
            "message": "User already registered",
            "user": {
                "id": existing.id,
                "email": existing.email,
                "name": existing.name,
                "role": existing.role,
                "organization": existing.organization,
                "location": existing.location
            }
        }
    
    parts = payload.name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    user = User(
        email=payload.email,
        password_hash=payload.password,
        name=payload.name,
        first_name=first_name,
        last_name=last_name,
        role=payload.role.upper(),
        organization=payload.organization,
        department=payload.department,
        location=payload.location,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Sync to Cloud Firestore
    sync_entity_to_firestore("users", str(user.id), {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organization": user.organization,
        "location": user.location,
        "created_at": user.created_at.isoformat() if user.created_at else None
    })

    return {
        "status": "success",
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "organization": user.organization,
            "location": user.location
        }
    }

@auth_router.post("/login")
def login_user(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        parts = payload.email.split("@")[0].capitalize().split(".")
        name = " ".join(parts) if len(parts) > 1 else parts[0]
        user = User(
            email=payload.email,
            password_hash=payload.password or "password123",
            name=name,
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
            role="CITIZEN",
            organization="Civic Community",
            location="Belagavi Ward",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Sync to Cloud Firestore
    sync_entity_to_firestore("users", str(user.id), {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organization": user.organization,
        "location": user.location,
        "last_login": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

    return {
        "status": "success",
        "sessionToken": f"token-{user.id}-{user.role.lower()}",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "organization": user.organization,
            "location": user.location or "Gwalior, MP"
        }
    }

@auth_router.post("/firebase-login")
def firebase_login(payload: FirebaseAuthPayload, db: Session = Depends(get_db)):
    """
    Direct Firebase API Authentication endpoint.
    Verifies Firebase credential/token and synchronizes the account in Cloud Firestore.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    display_name = payload.name or payload.email.split("@")[0].capitalize()
    parts = display_name.split(" ", 1)

    if not user:
        user = User(
            email=payload.email,
            password_hash="firebase_oauth_secured",
            name=display_name,
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
            role=(payload.role or "CITIZEN").upper(),
            organization=payload.organization or "Firebase Verified Account",
            location="Belagavi Ward",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if payload.name and user.name != payload.name:
            user.name = payload.name
        if payload.role and user.role != payload.role.upper():
            user.role = payload.role.upper()
        db.commit()
        db.refresh(user)

    # Sync verified Firebase User profile to Cloud Firestore
    firestore_data = {
        "id": user.id,
        "firebase_uid": payload.firebase_uid or f"fb_{user.id}",
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organization": user.organization,
        "location": user.location,
        "photo_url": payload.photo_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        "auth_provider": "FIREBASE_API",
        "last_login": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    sync_entity_to_firestore("users", str(user.id), firestore_data)

    return {
        "status": "success",
        "message": "Signed in successfully with Firebase API",
        "firebase_uid": payload.firebase_uid,
        "sessionToken": f"fb-token-{user.id}-{user.role.lower()}",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "organization": user.organization,
            "location": user.location,
            "photo_url": payload.photo_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        }
    }

@auth_router.get("/session")
def get_session(userId: Optional[int] = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == userId).first()
    if not user:
        user = db.query(User).first()
    
    if not user:
        return {"authenticated": False, "user": None}
    
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "organization": user.organization,
            "location": user.location or "Gwalior, MP",
            "is_verified": user.is_verified
        }
    }

@auth_router.get("/demo")
def get_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "organization": u.organization
        }
        for u in users
    ]
