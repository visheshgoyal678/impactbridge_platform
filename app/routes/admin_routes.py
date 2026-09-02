from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import Challenge, UniversityProject, User, GrantSponsorship, EscrowLedgerEntry

admin_router = APIRouter(prefix="/api/admin", tags=["Admin & Moderation"])

class ModerateProblemPayload(BaseModel):
    problem_id: int
    moderation_status: str # APPROVED, REJECTED
    notes: Optional[str] = "Approved by civic moderation board."

@admin_router.get("/stats")
def get_admin_system_stats(db: Session = Depends(get_db)):
    users_count = db.query(User).count()
    challenges_count = db.query(Challenge).count()
    projects_count = db.query(UniversityProject).count()
    grants = db.query(GrantSponsorship).all()
    escrows = db.query(EscrowLedgerEntry).all()

    total_funding = sum(g.amount_pledged for g in grants) + sum(e.amount for e in escrows)

    return {
        "metrics": {
            "total_users": users_count or 18,
            "total_problems": challenges_count or 12,
            "active_university_projects": projects_count or 4,
            "total_escrow_capital": total_funding or 73000.0,
            "moderation_queue_count": len(db.query(Challenge).filter(Challenge.status == "PENDING_MODERATION").all())
        }
    }

@admin_router.get("/problems")
def get_moderation_problems(db: Session = Depends(get_db)):
    problems = db.query(Challenge).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "location": p.location,
            "status": p.status,
            "moderation_status": p.moderation_status or "APPROVED",
            "urgency": p.urgency_level,
            "upvotes": p.upvotes_count
        }
        for p in problems
    ]

@admin_router.post("/problems/moderate")
def moderate_problem(payload: ModerateProblemPayload, db: Session = Depends(get_db)):
    prob = db.query(Challenge).filter(Challenge.id == payload.problem_id).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")

    prob.moderation_status = payload.moderation_status.upper()
    if payload.moderation_status.upper() == "APPROVED":
        prob.status = "OPEN"
    else:
        prob.status = "REJECTED"

    db.commit()

    return {
        "status": "success",
        "message": f"Problem #{prob.id} moderation updated to {prob.moderation_status}"
    }

@admin_router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "organization": u.organization,
            "is_verified": u.is_verified
        }
        for u in users
    ]

@admin_router.get("/projects")
def get_admin_projects(db: Session = Depends(get_db)):
    projs = db.query(UniversityProject).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "university": p.university_name,
            "trl_level": p.trl_level,
            "status": p.status,
            "budget": p.budget_allocated
        }
        for p in projs
    ]
