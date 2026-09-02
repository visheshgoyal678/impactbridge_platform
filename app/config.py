import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CivicNexus: Digital Innovation Ecosystem & Multi-Role Portal"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./impactbridge.db")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # UN Sustainable Development Goals (SDGs)
    SDG_CATALOG: dict = {
        "SDG_1": {"code": 1, "title": "No Poverty", "color": "#E5243B", "icon": "hand-coins"},
        "SDG_2": {"code": 2, "title": "Zero Hunger", "color": "#DDA63A", "icon": "utensils"},
        "SDG_3": {"code": 3, "title": "Good Health & Well-being", "color": "#4C9F38", "icon": "heart-pulse"},
        "SDG_4": {"code": 4, "title": "Quality Education", "color": "#C5192D", "icon": "graduation-cap"},
        "SDG_5": {"code": 5, "title": "Gender Equality", "color": "#FF3A21", "icon": "scale"},
        "SDG_6": {"code": 6, "title": "Clean Water & Sanitation", "color": "#26BDE2", "icon": "droplet"},
        "SDG_7": {"code": 7, "title": "Affordable & Clean Energy", "color": "#FCC30B", "icon": "zap"},
        "SDG_8": {"code": 8, "title": "Decent Work & Economic Growth", "color": "#A21942", "icon": "trending-up"},
        "SDG_9": {"code": 9, "title": "Industry, Innovation & Infrastructure", "color": "#FD6925", "icon": "cpu"},
        "SDG_10": {"code": 10, "title": "Reduced Inequalities", "color": "#DD1367", "icon": "users"},
        "SDG_11": {"code": 11, "title": "Sustainable Cities & Communities", "color": "#FD9D24", "icon": "building"},
        "SDG_12": {"code": 12, "title": "Responsible Consumption & Production", "color": "#BF8B2E", "icon": "recycle"},
        "SDG_13": {"code": 13, "title": "Climate Action", "color": "#3F7E44", "icon": "leaf"},
        "SDG_14": {"code": 14, "title": "Life Below Water", "color": "#0A97D9", "icon": "waves"},
        "SDG_15": {"code": 15, "title": "Life on Land", "color": "#56C02B", "icon": "trees"},
    }

    # Milestone Phases & Grant Escrow Release Percentages
    MILESTONE_PHASES: list = [
        {"key": "FEASIBILITY", "name": "Phase 1: Research & Feasibility Study", "percentage": 20, "description": "Literature review, stakeholder interviews, technical feasibility report."},
        {"key": "PROTOTYPE", "name": "Phase 2: MVP & Lab Prototyping", "percentage": 30, "description": "Working hardware/software prototype, bench testing, faculty verification."},
        {"key": "FIELD_TESTING", "name": "Phase 3: Community Field Validation", "percentage": 30, "description": "Live deployment with end-users, usability feedback, impact validation."},
        {"key": "SCALE_PILOT", "name": "Phase 4: Industrial Pilot & Scale", "percentage": 20, "description": "Industrial handover, open-source documentation, IP transfer, scaling roadmap."}
    ]

    # Firebase & Cloud Firestore Configuration
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "AIzaSyCivicNexusDemoKeyForFirebaseWeb")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "impactbridge-app")
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN", "impactbridge-app.firebaseapp.com")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "impactbridge-app.appspot.com")
    FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "123456789012")
    FIREBASE_APP_ID: str = os.getenv("FIREBASE_APP_ID", "1:123456789012:web:abcdef1234567890")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
    FIREBASE_DATABASE_URL: str = os.getenv("FIREBASE_DATABASE_URL", "")
    FIREBASE_SYNC_ON_WRITE: bool = os.getenv("FIREBASE_SYNC_ON_WRITE", "True").lower() == "true"

settings = Settings()
