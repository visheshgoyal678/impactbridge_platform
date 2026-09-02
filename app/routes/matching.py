from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.database_models import User, Challenge, Solution
from app.models.schemas import MatchRecommendation
from app.services.matcher import SemanticMatcher

router = APIRouter(prefix="/api/matching", tags=["AI Matchmaking & Recommendations"])

@router.get("/challenges-for-user/{user_id}", response_model=List[MatchRecommendation])
def match_challenges_for_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    open_challenges = db.query(Challenge).filter(Challenge.status.in_(["OPEN", "IN_PROGRESS"])).all()
    recommendations = SemanticMatcher.match_challenges_for_user(user, open_challenges)
    return recommendations

@router.get("/mentors-for-solution/{solution_id}", response_model=List[MatchRecommendation])
def match_mentors_for_solution(solution_id: int, db: Session = Depends(get_db)):
    solution = db.query(Solution).filter(Solution.id == solution_id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    mentor_users = db.query(User).filter(User.role.in_(["INDUSTRY", "FACULTY"])).all()
    recommendations = SemanticMatcher.match_mentors_for_solution(solution, mentor_users)
    return recommendations

@router.post("/match-custom")
def match_custom_query(payload: dict, db: Session = Depends(get_db)):
    query = payload.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query string is required")

    challenges = db.query(Challenge).all()
    results = []
    for ch in challenges:
        corpus = f"{ch.title} {ch.description} {ch.category} {ch.sdg_tag} {ch.location or ''}"
        sim = SemanticMatcher.calculate_similarity(query, corpus)
        if sim > 0.05:
            results.append({
                "id": ch.id,
                "title": ch.title,
                "category": ch.category,
                "sdg_tag": ch.sdg_tag,
                "urgency_level": ch.urgency_level,
                "similarity_score": round(sim * 100, 1),
                "budget_needed": ch.budget_needed
            })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"query": query, "matches": results[:6]}
