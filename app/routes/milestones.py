import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import (
    Milestone, Solution, GrantSponsorship, User,
    ActivityLog, Challenge
)
from app.models.schemas import (
    MilestoneRead, MilestoneSubmit, MilestoneApprove
)
from app.services.notification import log_activity

router = APIRouter(prefix="/api/milestones", tags=["Milestone Pipeline & Grant Escrow"])

@router.get("/solution/{solution_id}", response_model=List[MilestoneRead])
def get_solution_milestones(solution_id: int, db: Session = Depends(get_db)):
    sol = db.query(Solution).filter(Solution.id == solution_id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")
    return sol.milestones

@router.post("/{milestone_id}/submit", response_model=MilestoneRead)
def submit_milestone_deliverable(
    milestone_id: int,
    submission: MilestoneSubmit,
    db: Session = Depends(get_db)
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.deliverable_url = submission.deliverable_url
    milestone.status = "SUBMITTED"
    milestone.submitted_at = datetime.datetime.now(datetime.timezone.utc)
    if submission.submission_notes:
        milestone.feedback_notes = f"Submission Note: {submission.submission_notes}"

    db.commit()
    db.refresh(milestone)

    # Log activity
    sol = db.query(Solution).filter(Solution.id == milestone.solution_id).first()
    team_name = sol.team.name if sol and sol.team else "Student Team"
    log_activity(
        db=db,
        actor_name=team_name,
        actor_role="STUDENT",
        action_type="MILESTONE_SUBMITTED",
        title=f"Milestone Deliverable Submitted ({milestone.phase_key})",
        description=f"{team_name} submitted deliverable for '{milestone.title}'",
        entity_type="MILESTONE",
        entity_id=milestone.id
    )

    return milestone

@router.post("/{milestone_id}/approve", response_model=MilestoneRead)
def approve_milestone(
    milestone_id: int,
    approval: MilestoneApprove,
    db: Session = Depends(get_db)
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    approver = db.query(User).filter(User.id == approval.approver_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="Approver user not found")

    milestone.status = "FUND_RELEASED"
    milestone.approved_at = datetime.datetime.now(datetime.timezone.utc)
    if approval.feedback_notes:
        milestone.feedback_notes = approval.feedback_notes

    if approval.approver_role == "FACULTY":
        milestone.approved_by_faculty_id = approver.id
    else:
        milestone.approved_by_mentor_id = approver.id

    # Release tranche amount from associated active GrantSponsorship
    sol = db.query(Solution).filter(Solution.id == milestone.solution_id).first()
    grant = db.query(GrantSponsorship).filter(GrantSponsorship.solution_id == sol.id).first()
    if not grant and sol:
        grant = db.query(GrantSponsorship).filter(GrantSponsorship.challenge_id == sol.challenge_id).first()

    released_amt = milestone.grant_tranche_amount
    if grant:
        grant.amount_released += released_amt
        if grant.amount_released >= grant.amount_pledged:
            grant.status = "FULLY_DISBURSED"
        db.commit()

    # Check if all milestones are completed to mark solution and challenge as resolved
    all_milestones = db.query(Milestone).filter(Milestone.solution_id == milestone.solution_id).all()
    if all(m.status == "FUND_RELEASED" for m in all_milestones):
        sol.status = "DEPLOYED"
        if sol.challenge:
            sol.challenge.status = "RESOLVED"
        db.commit()

    db.commit()
    db.refresh(milestone)

    # Log activity
    log_activity(
        db=db,
        actor_name=approver.name,
        actor_role=approver.role,
        action_type="GRANT_DISBURSED",
        title=f"Milestone Approved & Grant Released (${released_amt:,.2f})",
        description=f"{approver.name} ({approver.organization or approver.role}) approved '{milestone.title}' and released ${released_amt:,.2f} grant tranche.",
        entity_type="MILESTONE",
        entity_id=milestone.id
    )

    return milestone
