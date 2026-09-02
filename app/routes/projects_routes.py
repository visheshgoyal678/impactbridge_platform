from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import (
    UniversityProject, Challenge, User, StudentApplication,
    IndustryCollaboration, PilotDeployment, EscrowLedgerEntry, ActivityLog
)

projects_router = APIRouter(prefix="/api/projects", tags=["Civic Projects & Workspaces"])

class ClaimPayload(BaseModel):
    challenge_id: int
    faculty_id: int = 1
    university_name: str = "IIT Indore - Embedded Sensor Lab"
    project_title: str
    project_description: str
    trl_level: int = 3
    open_roles: Optional[str] = "Embedded Systems Engineer, React Frontend, LoRa Telemetry"
    initial_budget: float = 15000.0

class PilotPayload(BaseModel):
    project_id: int
    location_name: str
    latitude: Optional[float] = 15.8497
    longitude: Optional[float] = 74.4977
    beneficiaries_count: int = 1200
    sensor_telemetry_summary: Optional[str] = "Soil moisture probe array connected via LoRaWAN node 04."

@projects_router.get("")
@projects_router.get("/explore")
def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(UniversityProject).all()
    results = []
    for p in projects:
        chal = db.query(Challenge).filter(Challenge.id == p.challenge_id).first()
        faculty = db.query(User).filter(User.id == p.faculty_lead_id).first()
        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "university": p.university_name,
            "university_name": p.university_name,
            "faculty_name": faculty.name if faculty else "Prof. Arvind Narayanan",
            "trl_level": p.trl_level or 5,
            "status": p.status or "ACTIVE",
            "open_roles": p.open_roles or "Embedded Systems, LoRa Telemetry, React Frontend",
            "budget_allocated": p.budget_allocated or 18000.0,
            "challenge_id": p.challenge_id,
            "challenge_title": chal.title if chal else "Urban Infrastructure & Water Telemetry",
            "challenge_category": chal.category if chal else "Infrastructure",
            "challenge_sdg": chal.sdg_tag if chal else "SDG_9",
            "challenge_location": chal.location if chal else "Belagavi, Karnataka",
            "challenge": {
                "id": chal.id if chal else 1,
                "title": chal.title if chal else "Civic Problem",
                "category": chal.category if chal else "Infrastructure",
                "sdg_tag": chal.sdg_tag if chal else "SDG_9",
                "location": chal.location if chal else "Belagavi"
            }
        })
    return results

@projects_router.post("/claim")
def claim_challenge(payload: ClaimPayload, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == payload.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    challenge.status = "CLAIMED"

    project = UniversityProject(
        challenge_id=payload.challenge_id,
        faculty_lead_id=payload.faculty_id,
        university_name=payload.university_name,
        title=payload.project_title,
        description=payload.project_description,
        trl_level=payload.trl_level,
        status="ACTIVE",
        open_roles=payload.open_roles,
        budget_allocated=payload.initial_budget
    )
    db.add(project)

    # Add activity log
    log = ActivityLog(
        actor_name=payload.university_name,
        actor_role="FACULTY",
        action_type="CLAIMED_CHALLENGE",
        title=f"Lab Project Created: {payload.project_title}",
        description=f"Claimed challenge #{challenge.id} '{challenge.title}' with TRL {payload.trl_level}",
        entity_type="PROJECT"
    )
    db.add(log)

    db.commit()
    db.refresh(project)

    return {
        "status": "success",
        "message": "Challenge claimed and University Research Workspace initialized",
        "project_id": project.id
    }

@projects_router.get("/{project_id}")
def get_project_workspace(project_id: int, db: Session = Depends(get_db)):
    p = db.query(UniversityProject).filter(UniversityProject.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    chal = db.query(Challenge).filter(Challenge.id == p.challenge_id).first()
    apps = db.query(StudentApplication).filter(StudentApplication.project_id == project_id).all()
    collabs = db.query(IndustryCollaboration).filter(IndustryCollaboration.project_id == project_id).all()
    pilots = db.query(PilotDeployment).filter(PilotDeployment.project_id == project_id).all()
    escrows = db.query(EscrowLedgerEntry).filter(EscrowLedgerEntry.project_id == project_id).all()

    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "university": p.university_name,
        "trl_level": p.trl_level,
        "status": p.status,
        "budget_allocated": p.budget_allocated,
        "open_roles": p.open_roles,
        "challenge": {
            "id": chal.id if chal else None,
            "title": chal.title if chal else "Civic Problem",
            "category": chal.category if chal else "Infrastructure",
            "sdg_tag": chal.sdg_tag if chal else "SDG_9",
            "location": chal.location if chal else "Belagavi"
        },
        "applications": [
            {
                "id": a.id,
                "desired_role": a.desired_role,
                "status": a.status,
                "statement": a.statement_of_purpose
            }
            for a in apps
        ],
        "industry_collaborations": [
            {
                "id": c.id,
                "company_name": c.company_name,
                "offer_type": c.offer_type,
                "funding_amount": c.funding_amount,
                "status": c.status
            }
            for c in collabs
        ],
        "pilots": [
            {
                "id": pi.id,
                "location": pi.location_name,
                "beneficiaries": pi.beneficiaries_count,
                "status": pi.status,
                "telemetry": pi.sensor_telemetry_summary
            }
            for pi in pilots
        ],
        "escrow_ledger": [
            {
                "id": e.id,
                "milestone": e.milestone_title,
                "amount": e.amount,
                "status": e.status
            }
            for e in escrows
        ]
    }

@projects_router.post("/{project_id}/pilots")
def create_project_pilot(project_id: int, payload: PilotPayload, db: Session = Depends(get_db)):
    project = db.query(UniversityProject).filter(UniversityProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pilot = PilotDeployment(
        project_id=project_id,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        beneficiaries_count=payload.beneficiaries_count,
        sensor_telemetry_summary=payload.sensor_telemetry_summary,
        status="ACTIVE"
    )
    db.add(pilot)
    db.commit()
    db.refresh(pilot)

    return {
        "status": "success",
        "message": "Field Pilot Testbed registered",
        "pilot_id": pilot.id
    }

@projects_router.get("/{project_id}/updates")
def get_project_updates(project_id: int, db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(ActivityLog.entity_id == project_id).all()
    if not logs:
        logs = db.query(ActivityLog).limit(5).all()
    return [
        {
            "id": l.id,
            "actor_name": l.actor_name,
            "actor_role": l.actor_role,
            "title": l.title,
            "description": l.description,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in logs
    ]
