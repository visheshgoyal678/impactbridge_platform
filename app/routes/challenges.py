from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database.db import get_db
from app.models.database_models import Challenge, ChallengeVote, ChallengeComment, User
from app.models.schemas import (
    ChallengeRead, ChallengeCreate, ChallengeCommentRead,
    ChallengeCommentCreate, DuplicateCheckResult
)
from app.services.matcher import SemanticMatcher
from app.services.notification import log_activity
from app.database.firebase_db import sync_entity_to_firestore, store_image_in_firebase

router = APIRouter(prefix="/api/challenges", tags=["Challenges"])

class ImageUploadPayload(BaseModel):
    image_data_url: str
    title: Optional[str] = "ground_problem_evidence"
    metadata: Optional[Dict[str, Any]] = None

class AIEnhancePayload(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = None
    location: Optional[str] = None
    style: Optional[str] = "COMPREHENSIVE"

@router.post("/upload-image")
def upload_evidence_image(payload: ImageUploadPayload):
    """
    Directly stores problem photo evidence in Cloud Firestore 'evidence_images' collection.
    """
    res = store_image_in_firebase(
        image_data=payload.image_data_url,
        title=payload.title,
        metadata=payload.metadata
    )
    return res

@router.post("/ai-enhance")
def ai_enhance_problem_description(payload: AIEnhancePayload):
    """
    Synthesizes and structures a citizen rough description into a professional problem statement.
    """
    from app.services.ai_enhancer import ProblemDescriptionAIEngine
    result = ProblemDescriptionAIEngine.enhance(
        title=payload.title or "",
        rough_description=payload.description or "",
        category=payload.category,
        location=payload.location,
        style=payload.style or "COMPREHENSIVE"
    )
    return result

@router.get("", response_model=List[ChallengeRead])
def list_challenges(
    sdg_tag: Optional[str] = None,
    category: Optional[str] = None,
    urgency_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("recent", enum=["recent", "upvotes", "budget"]),
    db: Session = Depends(get_db)
):
    query = db.query(Challenge)

    if sdg_tag:
        query = query.filter(Challenge.sdg_tag == sdg_tag)
    if category:
        query = query.filter(Challenge.category == category)
    if urgency_level:
        query = query.filter(Challenge.urgency_level == urgency_level)
    if status:
        query = query.filter(Challenge.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Challenge.title.ilike(search_fmt)) |
            (Challenge.description.ilike(search_fmt)) |
            (Challenge.location.ilike(search_fmt)) |
            (Challenge.target_community.ilike(search_fmt))
        )

    if sort_by == "upvotes":
        query = query.order_by(desc(Challenge.upvotes_count))
    elif sort_by == "budget":
        query = query.order_by(desc(Challenge.budget_needed))
    else:
        query = query.order_by(desc(Challenge.created_at))

    return query.all()

@router.get("/{challenge_id}", response_model=ChallengeRead)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.post("", response_model=ChallengeRead)
def create_challenge(challenge_in: ChallengeCreate, db: Session = Depends(get_db)):
    poster = db.query(User).filter(User.id == challenge_in.poster_id).first()
    if not poster:
        poster = db.query(User).first()
        if not poster:
            poster = User(
                email="citizen@civicnexus.org",
                name="Arjun Sharma",
                role="CITIZEN",
                location="Belagavi Ward 4"
            )
            db.add(poster)
            db.commit()
            db.refresh(poster)
        challenge_in.poster_id = poster.id

    new_challenge = Challenge(
        title=challenge_in.title,
        description=challenge_in.description,
        category=challenge_in.category,
        sdg_tag=challenge_in.sdg_tag,
        location=challenge_in.location,
        latitude=challenge_in.latitude,
        longitude=challenge_in.longitude,
        urgency_level=challenge_in.urgency_level,
        target_community=challenge_in.target_community,
        budget_needed=challenge_in.budget_needed,
        poster_id=challenge_in.poster_id,
        status="OPEN",
        upvotes_count=1
    )
    db.add(new_challenge)
    db.commit()
    db.refresh(new_challenge)

    # Automatically add poster's initial upvote
    db.add(ChallengeVote(challenge_id=new_challenge.id, user_id=challenge_in.poster_id))
    db.commit()

    # Sync immediately to Cloud Firestore
    sync_entity_to_firestore("challenges", str(new_challenge.id), {
        "id": new_challenge.id,
        "title": new_challenge.title,
        "description": new_challenge.description,
        "category": new_challenge.category,
        "sdg_tag": new_challenge.sdg_tag,
        "location": new_challenge.location,
        "latitude": new_challenge.latitude,
        "longitude": new_challenge.longitude,
        "urgency_level": new_challenge.urgency_level,
        "status": new_challenge.status,
        "poster_id": new_challenge.poster_id,
        "upvotes_count": new_challenge.upvotes_count,
        "created_at": new_challenge.created_at.isoformat() if new_challenge.created_at else None
    })

    # Log activity
    log_activity(
        db=db,
        actor_name=poster.name,
        actor_role=poster.role,
        action_type="CHALLENGE_POSTED",
        title="New Societal Challenge Posted",
        description=f"{poster.name} posted challenge: '{new_challenge.title}'",
        entity_type="CHALLENGE",
        entity_id=new_challenge.id
    )

    return new_challenge

@router.post("/check-duplicate", response_model=DuplicateCheckResult)
def check_duplicate(payload: dict, db: Session = Depends(get_db)):
    title = payload.get("title", "")
    description = payload.get("description", "")
    existing_challenges = db.query(Challenge).all()
    result = SemanticMatcher.check_duplicate_challenges(
        title=title,
        description=description,
        existing_challenges=existing_challenges
    )
    return result

@router.post("/{challenge_id}/vote")
def vote_challenge(challenge_id: int, payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id", 1)
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    existing_vote = db.query(ChallengeVote).filter(
        ChallengeVote.challenge_id == challenge_id,
        ChallengeVote.user_id == user_id
    ).first()

    if existing_vote:
        db.delete(existing_vote)
        challenge.upvotes_count = max(0, challenge.upvotes_count - 1)
        voted = False
    else:
        new_vote = ChallengeVote(challenge_id=challenge_id, user_id=user_id)
        db.add(new_vote)
        challenge.upvotes_count += 1
        voted = True

    db.commit()

    # Sync upvote to Cloud Firestore
    sync_entity_to_firestore("challenges", str(challenge.id), {
        "upvotes_count": challenge.upvotes_count
    })

    return {"status": "success", "voted": voted, "upvotes_count": challenge.upvotes_count}

@router.post("/{challenge_id}/comments", response_model=ChallengeCommentRead)
def add_comment(challenge_id: int, comment_in: ChallengeCommentCreate, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    comment = ChallengeComment(
        challenge_id=challenge_id,
        user_id=comment_in.user_id,
        author_name=comment_in.author_name,
        author_role=comment_in.author_role,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Activity log
    log_activity(
        db=db,
        actor_name=comment_in.author_name,
        actor_role=comment_in.author_role,
        action_type="COMMENT_ADDED",
        title="Community Comment Added",
        description=f"{comment_in.author_name} commented on '{challenge.title}'",
        entity_type="CHALLENGE",
        entity_id=challenge.id
    )

    return comment
