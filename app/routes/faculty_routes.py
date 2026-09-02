from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import User, UniversityProject, StudentApplication, Challenge, Team, Solution

faculty_router = APIRouter(prefix="/api/faculty", tags=["Faculty & Lab Hub"])

class ReviewApplicationPayload(BaseModel):
    application_id: int
    decision: str # ACCEPTED, REJECTED
    feedback: Optional[str] = "Approved to join the laboratory research team."

@faculty_router.get("/dashboard")
def get_faculty_dashboard(faculty_id: int = 1, db: Session = Depends(get_db)):
    projects = db.query(UniversityProject).all()
    apps = db.query(StudentApplication).all()
    open_challenges = db.query(Challenge).filter(Challenge.status == "OPEN").all()

    return {
        "faculty": {
            "id": faculty_id,
            "name": "Dr. Ramesh Nair",
            "role": "FACULTY",
            "institution": "IIT Indore - Embedded Sensor Lab",
            "verified": True
        },
        "managed_projects": [
            {
                "id": p.id,
                "title": p.title,
                "challenge_id": p.challenge_id,
                "trl_level": p.trl_level,
                "status": p.status,
                "applications_count": len([a for a in apps if a.project_id == p.id])
            }
            for p in projects
        ],
        "claimable_challenges": [
            {
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "sdg_tag": c.sdg_tag,
                "location": c.location,
                "urgency_level": c.urgency_level
            }
            for c in open_challenges
        ]
    }

@faculty_router.get("/applications")
def get_faculty_review_applications(db: Session = Depends(get_db)):
    apps = db.query(StudentApplication).all()
    results = []
    for a in apps:
        student = db.query(User).filter(User.id == a.applicant_id).first()
        proj = db.query(UniversityProject).filter(UniversityProject.id == a.project_id).first()
        results.append({
            "id": a.id,
            "student_id": a.applicant_id,
            "student_name": student.name if student else "Student Applicant",
            "student_email": student.email if student else "student@univ.edu",
            "project_id": a.project_id,
            "project_title": proj.title if proj else "Research Lab Project",
            "desired_role": a.desired_role,
            "statement_of_purpose": a.statement_of_purpose,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return results

@faculty_router.post("/applications/review")
def review_student_application(payload: ReviewApplicationPayload, db: Session = Depends(get_db)):
    app_entry = db.query(StudentApplication).filter(StudentApplication.id == payload.application_id).first()
    if not app_entry:
        raise HTTPException(status_code=404, detail="Application not found")

    app_entry.status = payload.decision.upper()
    db.commit()

    return {
        "status": "success",
        "message": f"Application status updated to {app_entry.status}",
        "application_id": app_entry.id
    }
