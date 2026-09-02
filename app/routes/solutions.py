from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.db import get_db
from app.models.database_models import (
    Solution, Team, TeamMember, User, Challenge,
    Milestone, GrantSponsorship
)
from app.models.schemas import (
    SolutionRead, SolutionCreate, TeamRead,
    TeamCreate, TeamMemberCreate, UserRead
)
from app.config import settings
from app.services.notification import log_activity

router = APIRouter(prefix="/api/solutions", tags=["Solutions & Teams"])

# --- SOLUTIONS ---
@router.get("", response_model=List[SolutionRead])
def list_solutions(
    challenge_id: Optional[int] = None,
    team_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Solution)
    if challenge_id:
        query = query.filter(Solution.challenge_id == challenge_id)
    if team_id:
        query = query.filter(Solution.team_id == team_id)
    if status:
        query = query.filter(Solution.status == status)
    return query.order_by(desc(Solution.created_at)).all()

@router.get("/{solution_id}", response_model=SolutionRead)
def get_solution(solution_id: int, db: Session = Depends(get_db)):
    sol = db.query(Solution).filter(Solution.id == solution_id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")
    return sol

@router.post("", response_model=SolutionRead)
def create_solution(solution_in: SolutionCreate, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == solution_in.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    team = db.query(Team).filter(Team.id == solution_in.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    new_sol = Solution(
        challenge_id=solution_in.challenge_id,
        team_id=solution_in.team_id,
        title=solution_in.title,
        abstract=solution_in.abstract,
        tech_stack=solution_in.tech_stack,
        repository_url=solution_in.repository_url,
        demo_url=solution_in.demo_url,
        status="PROPOSED",
        faculty_approved=False
    )
    db.add(new_sol)
    db.commit()
    db.refresh(new_sol)

    # Initialize 4 standard milestone phases for this solution
    total_budget = challenge.budget_needed or 10000.0
    for phase_info in settings.MILESTONE_PHASES:
        tranche_amt = round(total_budget * (phase_info["percentage"] / 100.0), 2)
        milestone = Milestone(
            solution_id=new_sol.id,
            phase_key=phase_info["key"],
            title=phase_info["name"],
            description=phase_info["description"],
            grant_tranche_percentage=phase_info["percentage"],
            grant_tranche_amount=tranche_amt,
            status="PENDING"
        )
        db.add(milestone)
    db.commit()

    # If challenge is still open, mark as in progress
    if challenge.status == "OPEN":
        challenge.status = "IN_PROGRESS"
        db.commit()

    # Log activity
    log_activity(
        db=db,
        actor_name=team.name,
        actor_role="STUDENT",
        action_type="SOLUTION_PROPOSED",
        title="New Solution Proposal Submitted",
        description=f"{team.name} proposed solution: '{new_sol.title}' for '{challenge.title}'",
        entity_type="SOLUTION",
        entity_id=new_sol.id
    )

    db.refresh(new_sol)
    return new_sol

@router.post("/{solution_id}/faculty-endorse")
def faculty_endorse_solution(solution_id: int, payload: dict, db: Session = Depends(get_db)):
    faculty_id = payload.get("faculty_id")
    faculty = db.query(User).filter(User.id == faculty_id, User.role == "FACULTY").first()
    if not faculty:
        raise HTTPException(status_code=400, detail="Invalid faculty advisor ID")

    sol = db.query(Solution).filter(Solution.id == solution_id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")

    sol.faculty_approved = True
    if sol.status == "PROPOSED":
        sol.status = "UNDER_REVIEW"
    db.commit()

    # Log activity
    log_activity(
        db=db,
        actor_name=faculty.name,
        actor_role="FACULTY",
        action_type="FACULTY_ENDORSEMENT",
        title="Faculty Endorsement Granted",
        description=f"{faculty.name} endorsed student solution '{sol.title}'",
        entity_type="SOLUTION",
        entity_id=sol.id
    )

    return {"status": "success", "faculty_approved": True, "solution_status": sol.status}

# --- TEAMS ---
@router.get("/teams/all", response_model=List[TeamRead])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).order_by(desc(Team.created_at)).all()

@router.post("/teams/create", response_model=TeamRead)
def create_team(team_in: TeamCreate, db: Session = Depends(get_db)):
    leader = db.query(User).filter(User.id == team_in.leader_id).first()
    if not leader:
        raise HTTPException(status_code=404, detail="Team leader not found")

    new_team = Team(
        name=team_in.name,
        university=team_in.university,
        department=team_in.department,
        description=team_in.description,
        leader_id=team_in.leader_id,
        faculty_advisor_id=team_in.faculty_advisor_id
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    # Add leader as member
    db.add(TeamMember(team_id=new_team.id, user_id=leader.id, role_title="Team Lead"))
    
    # Add other members if provided
    for uid in team_in.member_user_ids:
        if uid != leader.id:
            user = db.query(User).filter(User.id == uid).first()
            if user:
                db.add(TeamMember(team_id=new_team.id, user_id=uid, role_title="Researcher"))

    db.commit()
    db.refresh(new_team)
    return new_team

@router.post("/teams/{team_id}/members")
def add_team_member(team_id: int, member_in: TeamMemberCreate, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_in.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already in team")

    m = TeamMember(team_id=team_id, user_id=member_in.user_id, role_title=member_in.role_title)
    db.add(m)
    db.commit()
    return {"status": "success", "message": f"Added {user.name} to {team.name}"}

# --- USERS / PERSONAS ---
@router.get("/users/all", response_model=List[UserRead])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()
