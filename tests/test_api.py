import os
import sys
import pytest

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_challenges_list_and_filters():
    # List all
    response = client.get("/api/challenges")
    assert response.status_code == 200
    challenges = response.json()
    assert len(challenges) >= 3

    # Filter by SDG
    response = client.get("/api/challenges?sdg_tag=SDG_6")
    assert response.status_code == 200
    sdg6_challenges = response.json()
    assert all(c["sdg_tag"] == "SDG_6" for c in sdg6_challenges)

def test_challenge_creation_and_voting():
    new_ch = {
        "title": "Solar Powered Cold Storage for Off-Grid Remote Fishers",
        "description": "Artisanal coastal fishers suffer high post-harvest spoilage. We need a low-cost phase-change thermal ice-box powered by small solar panels.",
        "category": "Clean Tech & Marine",
        "sdg_tag": "SDG_14",
        "location": "Ratnagiri, Maharashtra",
        "target_community": "500 Coastal Fisher Households",
        "urgency_level": "HIGH",
        "budget_needed": 16000.0,
        "poster_id": 1
    }
    response = client.post("/api/challenges", json=new_ch)
    assert response.status_code == 200
    created = response.json()
    assert created["title"] == new_ch["title"]
    challenge_id = created["id"]

    # Vote on challenge
    vote_res = client.post(f"/api/challenges/{challenge_id}/vote", json={"user_id": 1})
    assert vote_res.status_code == 200
    assert vote_res.json()["status"] == "success"

def test_civic_auth_routes():
    # Test Register
    reg_res = client.post("/api/auth/register", json={
        "email": "test.citizen@civicnexus.org",
        "name": "Neha Gupta",
        "role": "CITIZEN",
        "location": "Belagavi Ward 2"
    })
    assert reg_res.status_code == 200
    assert reg_res.json()["status"] == "success"

    # Test Login
    login_res = client.post("/api/auth/login", json={
        "email": "test.citizen@civicnexus.org"
    })
    assert login_res.status_code == 200
    assert "sessionToken" in login_res.json()

    # Test Session
    sess_res = client.get("/api/auth/session")
    assert sess_res.status_code == 200
    assert sess_res.json()["authenticated"] is True

def test_civic_student_and_faculty_routes():
    # Student projects list
    proj_res = client.get("/api/student/projects")
    assert proj_res.status_code == 200
    projects = proj_res.json()
    assert len(projects) >= 1

    # Student apply for project
    target_pid = projects[0]["id"]
    app_res = client.post("/api/student/applications", json={
        "project_id": target_pid,
        "applicant_id": 4,
        "desired_role": "MEMBER",
        "statement_of_purpose": "I have experience with embedded sensors and IoT gateways."
    })
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "success"

    # Faculty dashboard
    fac_res = client.get("/api/faculty/dashboard")
    assert fac_res.status_code == 200
    assert "managed_projects" in fac_res.json()

def test_civic_industry_and_escrow_routes():
    # Industry dashboard
    ind_res = client.get("/api/industry/dashboard")
    assert ind_res.status_code == 200
    assert "summary" in ind_res.json()

    # Industry offer collaboration
    offer_res = client.post("/api/industry/collaborations", json={
        "project_id": 1,
        "company_name": "Infosys CSR",
        "offer_type": "FUNDING",
        "funding_amount": 10000.0,
        "details": "Funding phase 2 sensor calibration equipment."
    })
    assert offer_res.status_code == 200
    assert offer_res.json()["status"] == "success"

def test_civic_discovery_and_search_routes():
    # Universities list
    univ_res = client.get("/api/universities")
    assert univ_res.status_code == 200
    assert len(univ_res.json()) >= 1

    # Global search
    search_res = client.get("/api/search?q=water")
    assert search_res.status_code == 200
    assert "results" in search_res.json()

    # Live Feed
    feed_res = client.get("/api/feed")
    assert feed_res.status_code == 200
    assert len(feed_res.json()) >= 1

    # Geocoding Autocomplete
    geo_res = client.get("/api/geocode/autocomplete?q=Belagavi")
    assert geo_res.status_code == 200
    assert len(geo_res.json()) >= 1

def test_civic_admin_routes():
    stats_res = client.get("/api/admin/stats")
    assert stats_res.status_code == 200
    assert "metrics" in stats_res.json()

    prob_res = client.get("/api/admin/problems")
    assert prob_res.status_code == 200
    assert len(prob_res.json()) >= 1

def test_firebase_endpoints():
    res = client.get("/api/firebase/status")
    assert res.status_code == 200
    data = res.json()
    assert "installed" in data
    assert "connected" in data
    assert "status" in data

    # Test Image storage in Firebase Cloud Firestore
    img_res = client.post("/api/challenges/upload-image", json={
        "image_data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
        "title": "Ground Drainage Rupture Evidence",
        "metadata": { "location": "Belagavi Ward 4", "urgency": "CRITICAL" }
    })
    assert img_res.status_code == 200
    assert img_res.json()["success"] is True
    assert "image_id" in img_res.json()

    # Test Firebase API Login & User Sync
    fb_auth_res = client.post("/api/auth/firebase-login", json={
        "email": "firebase_citizen@civicnexus.org",
        "name": "Firebase Verified Citizen",
        "firebase_uid": "fb_uid_test_12345",
        "role": "CITIZEN",
        "photo_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    })
    assert fb_auth_res.status_code == 200
    assert fb_auth_res.json()["status"] == "success"
    assert fb_auth_res.json()["user"]["email"] == "firebase_citizen@civicnexus.org"

    # Test City Hotspots endpoint
    map_res = client.get("/api/analytics/city-hotspots")
    assert map_res.status_code == 200
    assert "cities" in map_res.json()
    assert map_res.json()["total_active_cities"] >= 1

    # Test AI Problem Statement & Description Enhancer
    ai_res = client.post("/api/challenges/ai-enhance", json={
        "title": "broken pipe",
        "description": "dirty water coming out on road causing disease",
        "category": "Water & Agriculture",
        "location": "Belagavi Ward 4",
        "style": "COMPREHENSIVE"
    })
    assert ai_res.status_code == 200
    ai_data = ai_res.json()
    assert ai_data["success"] is True
    assert "Problem Overview" in ai_data["enhanced_description"]
    assert "suggested_sdg_tag" in ai_data


