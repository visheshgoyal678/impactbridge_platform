from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import User, UniversityProject, StudentApplication, TeamMember, Challenge

student_router = APIRouter(prefix="/api/student", tags=["Student Hub"])

class ApplicationPayload(BaseModel):
    project_id: int
    applicant_id: int = 1
    desired_role: str = "MEMBER" # LEAD, MEMBER, MENTOR
    statement_of_purpose: str
    resume_url: Optional[str] = "https://github.com/student-profile"

@student_router.get("/projects")
def get_student_available_projects(db: Session = Depends(get_db)):
    projects = db.query(UniversityProject).all()
    results = []
    for p in projects:
        chal = db.query(Challenge).filter(Challenge.id == p.challenge_id).first()
        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "university": p.university_name,
            "trl_level": p.trl_level,
            "open_roles": p.open_roles or "Embedded Systems, React Frontend, LoRa Telemetry",
            "budget_allocated": p.budget_allocated,
            "challenge_title": chal.title if chal else "Ground Challenge",
            "category": chal.category if chal else "Infrastructure",
            "sdg_tag": chal.sdg_tag if chal else "SDG_9"
        })
    return results

@student_router.get("/applications")
def get_student_applications(applicant_id: Optional[int] = None, db: Session = Depends(get_db)):
    if applicant_id:
        apps = db.query(StudentApplication).filter(StudentApplication.applicant_id == applicant_id).all()
        if not apps:
            apps = db.query(StudentApplication).all()
    else:
        apps = db.query(StudentApplication).all()

    results = []
    for a in apps:
        proj = db.query(UniversityProject).filter(UniversityProject.id == a.project_id).first()
        student = db.query(User).filter(User.id == a.applicant_id).first()
        chal = db.query(Challenge).filter(Challenge.id == proj.challenge_id).first() if proj else None
        results.append({
            "id": a.id,
            "project_id": a.project_id,
            "project_title": proj.title if proj else "AquaPulse Telemetry Project",
            "university": proj.university_name if proj else "IIT Indore Sensor Lab",
            "trl_level": proj.trl_level if proj else 5,
            "grant_allocated": proj.budget_allocated if proj else 18000.0,
            "challenge_title": chal.title if chal else "Urban Water Contamination Telemetry",
            "applicant_name": student.name if student else "Aarav Patel (Final Year B.Tech)",
            "applicant_email": student.email if student else "aarav.p@student.iiti.ac.in",
            "applicant_university": student.organization if student and student.organization else "IIT Indore",
            "desired_role": a.desired_role or "LEAD",
            "status": a.status or "ACCEPTED",
            "statement_of_purpose": a.statement_of_purpose or "Experienced in building LoRaWAN gateways and firmware on ESP32-S3.",
            "resume_url": a.resume_url or "https://github.com/student-profile",
            "created_at": a.created_at.isoformat() if a.created_at else "2026-08-20T10:00:00"
        })
    return results

@student_router.post("/applications")
def apply_for_project(payload: ApplicationPayload, db: Session = Depends(get_db)):
    project = db.query(UniversityProject).filter(UniversityProject.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    app_entry = StudentApplication(
        project_id=payload.project_id,
        applicant_id=payload.applicant_id,
        desired_role=payload.desired_role,
        statement_of_purpose=payload.statement_of_purpose,
        resume_url=payload.resume_url,
        status="PENDING"
    )
    db.add(app_entry)
    db.commit()
    db.refresh(app_entry)

    return {
        "status": "success",
        "message": "Application submitted to faculty lead",
        "application_id": app_entry.id
    }

@student_router.get("/profile")
def get_student_profile(student_id: int = 1, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    apps = db.query(StudentApplication).filter(StudentApplication.applicant_id == student_id).all()
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "university": student.organization or "IIT Indore",
        "department": student.department or "Electrical & Computer Engineering",
        "skills": student.skills or "Python, React, LoRaWAN, Three.js, Sensor Fusion",
        "applications_count": len(apps),
        "active_projects_count": len([a for a in apps if a.status == "ACCEPTED"])
    }
