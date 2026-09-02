from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.db import get_db
from app.models.database_models import University, Challenge, Solution, UniversityProject, User, ActivityLog

discovery_router = APIRouter(tags=["Discovery & Geospatial"])

@discovery_router.get("/api/universities")
def get_universities(db: Session = Depends(get_db)):
    univs = db.query(University).all()
    if not univs:
        # Seed top institutions if empty
        defaults = [
            University(name="IIT Bombay", location_name="Powai, Mumbai", latitude=19.1334, longitude=72.9133, service_radius_km=100.0, is_verified=True, departments="Civil, Computer Science, Environmental Engineering"),
            University(name="IIT Indore", location_name="Simrol, Indore", latitude=22.5204, longitude=75.9207, service_radius_km=80.0, is_verified=True, departments="Sensors & IoT, Electrical, Mechanical"),
            University(name="IIT Kharagpur", location_name="Kharagpur, West Bengal", latitude=22.3149, longitude=87.3105, service_radius_km=150.0, is_verified=True, departments="Water Resources, Agriculture, AI"),
            University(name="IISc Bangalore", location_name="Bangalore, Karnataka", latitude=13.0169, longitude=77.5685, service_radius_km=120.0, is_verified=True, departments="Sustainable Technologies, Nano Science")
        ]
        db.add_all(defaults)
        db.commit()
        univs = db.query(University).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "location": u.location_name,
            "latitude": u.latitude,
            "longitude": u.longitude,
            "service_radius_km": u.service_radius_km,
            "is_verified": u.is_verified,
            "departments": u.departments
        }
        for u in univs
    ]

@discovery_router.get("/api/search")
def global_search(q: str = Query("", description="Query string"), db: Session = Depends(get_db)):
    query_str = f"%{q}%"
    challenges = db.query(Challenge).filter(
        or_(Challenge.title.ilike(query_str), Challenge.description.ilike(query_str), Challenge.category.ilike(query_str))
    ).limit(10).all()

    projects = db.query(UniversityProject).filter(
        or_(UniversityProject.title.ilike(query_str), UniversityProject.description.ilike(query_str), UniversityProject.university_name.ilike(query_str))
    ).limit(10).all()

    solutions = db.query(Solution).filter(
        or_(Solution.title.ilike(query_str), Solution.abstract.ilike(query_str))
    ).limit(10).all()

    return {
        "query": q,
        "results": {
            "challenges": [
                {"id": c.id, "title": c.title, "category": c.category, "location": c.location, "status": c.status}
                for c in challenges
            ],
            "projects": [
                {"id": p.id, "title": p.title, "university": p.university_name, "trl_level": p.trl_level}
                for p in projects
            ],
            "solutions": [
                {"id": s.id, "title": s.title, "tech_stack": s.tech_stack, "status": s.status}
                for s in solutions
            ]
        }
    }

@discovery_router.get("/api/feed")
def get_live_activity_feed(db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(15).all()
    if not logs:
        # Provide rich activity items
        return [
            {
                "id": 1,
                "actor_name": "IIT Indore Sensor Lab",
                "actor_role": "FACULTY",
                "title": "Groundwater Telemetry Pilot Initiated",
                "description": "LoRaWAN sensor probe array deployed in Belagavi ward.",
                "timestamp": "10 mins ago"
            },
            {
                "id": 2,
                "actor_name": "Arjun Sharma",
                "actor_role": "CITIZEN",
                "title": "New Challenge Raised",
                "description": "Reported severe waterlogging near Community Health Center.",
                "timestamp": "1 hour ago"
            },
            {
                "id": 3,
                "actor_name": "Tata CSR Foundation",
                "actor_role": "INDUSTRY",
                "title": "$25,000 Escrow Grant Deposited",
                "description": "Escrow tranche locked for Clean Water Solar Purification prototype.",
                "timestamp": "3 hours ago"
            }
        ]

    return [
        {
            "id": l.id,
            "actor_name": l.actor_name,
            "actor_role": l.actor_role,
            "title": l.title,
            "description": l.description,
            "timestamp": l.created_at.strftime("%b %d, %H:%M") if l.created_at else "Recent"
        }
        for l in logs
    ]

@discovery_router.get("/api/recommendations")
def get_recommendations(user_id: int = 1, db: Session = Depends(get_db)):
    challenges = db.query(Challenge).filter(Challenge.status == "OPEN").limit(4).all()
    projects = db.query(UniversityProject).filter(UniversityProject.status == "ACTIVE").limit(3).all()

    return {
        "recommended_challenges": [
            {"id": c.id, "title": c.title, "category": c.category, "match_score": 92}
            for c in challenges
        ],
        "recommended_projects": [
            {"id": p.id, "title": p.title, "university": p.university_name, "match_score": 88}
            for p in projects
        ]
    }

@discovery_router.get("/api/geocode/autocomplete")
def geocode_autocomplete(q: str = Query("Belagavi")):
    wards = [
        {"place_id": 1, "description": f"{q}, Belagavi District, Karnataka", "lat": 15.8497, "lng": 74.4977},
        {"place_id": 2, "description": f"{q} Sector 4, Gwalior, Madhya Pradesh", "lat": 26.2183, "lng": 78.1828},
        {"place_id": 3, "description": f"{q} Delta Zone, Sundarbans, West Bengal", "lat": 21.9497, "lng": 89.1833}
    ]
    return wards

@discovery_router.get("/api/geocode/reverse")
def geocode_reverse(lat: float = 15.8497, lng: float = 74.4977):
    return {
        "formatted_address": "Belagavi Ward 4, Northern Karnataka, India",
        "district": "Belagavi",
        "state": "Karnataka",
        "country": "India"
    }
