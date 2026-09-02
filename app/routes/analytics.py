from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.db import get_db
from app.models.database_models import (
    Challenge, Solution, Team, GrantSponsorship,
    User, ActivityLog, PilotDeployment, UniversityProject
)
from app.models.schemas import DashboardKPIs
from app.config import settings

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Impact KPIs"])

@router.get("/dashboard", response_model=DashboardKPIs)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_challenges = db.query(Challenge).count()
    active_solutions = db.query(Solution).filter(Solution.status != "REJECTED").count()
    
    # Distinct universities
    universities = db.query(func.distinct(Team.university)).all()
    participating_universities = len(universities)

    # Industry partners
    industry_count = db.query(User).filter(User.role.in_(["INDUSTRY", "COMPANY_REP"])).count()

    # Financials
    total_pledged = db.query(func.sum(GrantSponsorship.amount_pledged)).scalar() or 0.0
    total_disbursed = db.query(func.sum(GrantSponsorship.amount_released)).scalar() or 0.0

    # Solved challenges
    solved_count = db.query(Challenge).filter(Challenge.status == "RESOLVED").count()

    # Active student innovators
    student_count = db.query(User).filter(User.role == "STUDENT").count()

    # SDG Distribution
    sdg_counts = db.query(Challenge.sdg_tag, func.count(Challenge.id)).group_by(Challenge.sdg_tag).all()
    sdg_dist = {tag: count for tag, count in sdg_counts}

    # Top categories
    cat_counts = db.query(Challenge.category, func.count(Challenge.id)).group_by(Challenge.category).order_by(desc(func.count(Challenge.id))).limit(5).all()
    top_categories = [{"category": cat, "count": count} for cat, count in cat_counts]

    # Recent activities
    recent_acts = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(10).all()
    recent_activity_list = [
        {
            "id": act.id,
            "actor_name": act.actor_name,
            "actor_role": act.actor_role,
            "action_type": act.action_type,
            "title": act.title,
            "description": act.description,
            "created_at": act.created_at.isoformat()
        }
        for act in recent_acts
    ]

    return DashboardKPIs(
        total_challenges=total_challenges,
        active_solutions=active_solutions,
        participating_universities=participating_universities,
        industry_partners_count=industry_count,
        total_grants_pledged=round(total_pledged, 2),
        total_grants_disbursed=round(total_disbursed, 2),
        solved_challenges_count=solved_count,
        active_innovators_count=student_count,
        sdg_distribution=sdg_dist,
        top_categories=top_categories,
        recent_activities=recent_activity_list
    )

@router.get("/city-hotspots")
def get_city_hotspots(db: Session = Depends(get_db)):
    """
    Returns geospatial city-wise problem aggregations and ward hotspot clusters
    for the interactive Leaflet / OpenStreetMap visualizer.
    """
    challenges = db.query(Challenge).all()

    # Default city metadata fallback centers
    city_coords = {
        "Belagavi": {"lat": 15.8497, "lng": 74.4977, "state": "Karnataka"},
        "Gwalior": {"lat": 26.2183, "lng": 78.1828, "state": "Madhya Pradesh"},
        "Mumbai": {"lat": 19.0760, "lng": 72.8777, "state": "Maharashtra"},
        "Marathwada": {"lat": 19.8762, "lng": 75.3433, "state": "Maharashtra"},
        "Bastar": {"lat": 19.0748, "lng": 82.0298, "state": "Chhattisgarh"},
        "Kochi": {"lat": 9.9312, "lng": 76.2673, "state": "Kerala"},
        "Indore": {"lat": 22.7196, "lng": 75.8577, "state": "Madhya Pradesh"},
        "Pune": {"lat": 18.5204, "lng": 73.8567, "state": "Maharashtra"},
        "Anantapur": {"lat": 14.6819, "lng": 77.6006, "state": "Andhra Pradesh"}
    }

    cities_summary: Dict[str, Any] = {}

    for c in challenges:
        # Determine city name from location string
        loc_str = c.location or "Belagavi"
        matched_city = "Belagavi"
        for city_key in city_coords.keys():
            if city_key.lower() in loc_str.lower():
                matched_city = city_key
                break

        if matched_city not in cities_summary:
            coords = city_coords.get(matched_city, {"lat": 15.8497, "lng": 74.4977, "state": "India"})
            cities_summary[matched_city] = {
                "city": matched_city,
                "state": coords["state"],
                "lat": coords["lat"],
                "lng": coords["lng"],
                "total_problems": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "resolved_count": 0,
                "wards": {},
                "problems": []
            }

        city_data = cities_summary[matched_city]
        city_data["total_problems"] += 1

        urgency = (c.urgency_level or "HIGH").upper()
        if urgency == "CRITICAL":
            city_data["critical_count"] += 1
        elif urgency == "HIGH":
            city_data["high_count"] += 1
        else:
            city_data["medium_count"] += 1

        if (c.status or "").upper() == "RESOLVED":
            city_data["resolved_count"] += 1

        # Extract ward
        ward_name = "Ward 4"
        if "ward" in loc_str.lower():
            parts = loc_str.split("Ward")
            if len(parts) > 1:
                ward_name = f"Ward {parts[1].split()[0].replace(',', '').strip()}"
        
        city_data["wards"][ward_name] = city_data["wards"].get(ward_name, 0) + 1

        # Push problem object
        city_data["problems"].append({
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "urgency": urgency,
            "status": c.status,
            "latitude": c.latitude or city_data["lat"],
            "longitude": c.longitude or city_data["lng"],
            "upvotes": c.upvotes_count or 0
        })

    return {
        "cities": list(cities_summary.values()),
        "total_active_cities": len(cities_summary),
        "total_problems": len(challenges)
    }

@router.get("/sdgs")
def get_sdg_catalog():
    return settings.SDG_CATALOG

@router.get("/activity")
def get_activity_feed(limit: int = 20, db: Session = Depends(get_db)):
    acts = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(limit).all()
    return acts
