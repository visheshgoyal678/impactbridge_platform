from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.db import get_db
from app.models.database_models import (
    GrantSponsorship, MentorshipAssignment, User,
    Solution, Challenge
)
from app.models.schemas import (
    GrantRead, GrantPledge, MentorshipRead,
    MentorshipAssign
)
from app.services.notification import log_activity

router = APIRouter(prefix="/api/partnerships", tags=["Industry & CSR Partnerships"])

@router.get("/grants", response_model=List[GrantRead])
def list_grants(
    sponsor_id: Optional[int] = None,
    challenge_id: Optional[int] = None,
    solution_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(GrantSponsorship)
    if sponsor_id:
        query = query.filter(GrantSponsorship.sponsor_id == sponsor_id)
    if challenge_id:
        query = query.filter(GrantSponsorship.challenge_id == challenge_id)
    if solution_id:
        query = query.filter(GrantSponsorship.solution_id == solution_id)
    return query.order_by(desc(GrantSponsorship.created_at)).all()

@router.post("/grants/pledge", response_model=GrantRead)
def pledge_grant(grant_in: GrantPledge, db: Session = Depends(get_db)):
    sponsor = db.query(User).filter(User.id == grant_in.sponsor_id).first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor user not found")

    challenge = db.query(Challenge).filter(Challenge.id == grant_in.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    grant = GrantSponsorship(
        challenge_id=grant_in.challenge_id,
        solution_id=grant_in.solution_id,
        sponsor_id=grant_in.sponsor_id,
        sponsor_company=grant_in.sponsor_company or sponsor.organization or "Corporate Partner",
        amount_pledged=grant_in.amount_pledged,
        amount_released=0.0,
        currency=grant_in.currency,
        csr_focus_area=grant_in.csr_focus_area,
        status="ACTIVE" if grant_in.solution_id else "PLEDGED"
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)

    # Log activity
    log_activity(
        db=db,
        actor_name=grant.sponsor_company,
        actor_role="INDUSTRY",
        action_type="GRANT_PLEDGED",
        title="CSR Grant Pledged",
        description=f"{grant.sponsor_company} pledged ${grant.amount_pledged:,.2f} grant towards '{challenge.title}'",
        entity_type="GRANT",
        entity_id=grant.id
    )

    return grant

@router.get("/mentors", response_model=List[MentorshipRead])
def list_mentorships(solution_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(MentorshipAssignment)
    if solution_id:
        query = query.filter(MentorshipAssignment.solution_id == solution_id)
    return query.order_by(desc(MentorshipAssignment.created_at)).all()

@router.post("/mentors/assign", response_model=MentorshipRead)
def assign_mentor(mentor_in: MentorshipAssign, db: Session = Depends(get_db)):
    sol = db.query(Solution).filter(Solution.id == mentor_in.solution_id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")

    mentor_user = db.query(User).filter(User.id == mentor_in.mentor_id).first()
    if not mentor_user:
        raise HTTPException(status_code=404, detail="Mentor user not found")

    assignment = MentorshipAssignment(
        solution_id=mentor_in.solution_id,
        mentor_id=mentor_in.mentor_id,
        mentor_name=mentor_in.mentor_name or mentor_user.name,
        mentor_company=mentor_in.mentor_company or mentor_user.organization or "Industry Expert",
        domain_expertise=mentor_in.domain_expertise or mentor_user.skills,
        status="ACTIVE",
        notes=mentor_in.notes
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Log activity
    log_activity(
        db=db,
        actor_name=assignment.mentor_name,
        actor_role="INDUSTRY",
        action_type="MENTOR_ASSIGNED",
        title="Industry Mentor Assigned",
        description=f"{assignment.mentor_name} ({assignment.mentor_company}) joined '{sol.title}' as technical mentor.",
        entity_type="SOLUTION",
        entity_id=sol.id
    )

    return assignment
