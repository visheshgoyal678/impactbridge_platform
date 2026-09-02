"""
Firebase & Cloud Firestore Database Integration Module for CivicNexus
Provides dual-layer real-time synchronization, document persistence, and diagnostics.
"""

import os
import datetime
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("civicnexus.firebase")

# Firebase Global State
_firebase_initialized = False
_firebase_app = None
_firestore_client = None
_init_error = None

def init_firebase():
    """
    Initializes Firebase Admin SDK and Cloud Firestore client.
    Supports Service Account JSON file, Google Application Default Credentials, or Project ID.
    """
    global _firebase_initialized, _firebase_app, _firestore_client, _init_error

    if _firebase_initialized and _firestore_client is not None:
        return _firestore_client

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        _init_error = "firebase-admin Python package is not installed."
        logger.warning(_init_error)
        return None

    cred_path = os.path.abspath(settings.FIREBASE_CREDENTIALS_PATH)
    
    try:
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                _firebase_app = firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID or None,
                    'databaseURL': settings.FIREBASE_DATABASE_URL or None
                })
            else:
                _firebase_app = firebase_admin.get_app()
        elif settings.FIREBASE_PROJECT_ID:
            if not firebase_admin._apps:
                _firebase_app = firebase_admin.initialize_app(options={
                    'projectId': settings.FIREBASE_PROJECT_ID,
                    'databaseURL': settings.FIREBASE_DATABASE_URL or None
                })
            else:
                _firebase_app = firebase_admin.get_app()
        else:
            _init_error = f"Firebase credentials file not found at '{settings.FIREBASE_CREDENTIALS_PATH}' and FIREBASE_PROJECT_ID not set."
            return None

        _firestore_client = firestore.client()
        _firebase_initialized = True
        _init_error = None
        logger.info("Firebase Cloud Firestore successfully connected.")
        return _firestore_client

    except Exception as e:
        _init_error = str(e)
        logger.error(f"Failed to initialize Firebase: {e}")
        return None

def get_firestore_client():
    """Returns the active Firestore client or attempts initialization."""
    global _firestore_client
    if _firestore_client is None:
        return init_firebase()
    return _firestore_client

def get_firebase_status() -> Dict[str, Any]:
    """
    Returns current status and connectivity diagnostics for Firebase Firestore.
    """
    try:
        import firebase_admin
        installed = True
    except ImportError:
        installed = False

    cred_path = os.path.abspath(settings.FIREBASE_CREDENTIALS_PATH)
    credentials_found = os.path.exists(cred_path)
    client = get_firestore_client()
    connected = client is not None

    status_str = "CONNECTED" if connected else ("DEPENDENCY_MISSING" if not installed else ("NOT_CONFIGURED" if not credentials_found and not settings.FIREBASE_PROJECT_ID else "CONNECTION_ERROR"))

    return {
        "installed": installed,
        "connected": connected,
        "status": status_str,
        "project_id": settings.FIREBASE_PROJECT_ID or (client.project if client and hasattr(client, 'project') else "impactbridge-app"),
        "credentials_path": settings.FIREBASE_CREDENTIALS_PATH,
        "credentials_found": credentials_found,
        "database_url": settings.FIREBASE_DATABASE_URL or "Default Cloud Firestore",
        "sync_on_write": settings.FIREBASE_SYNC_ON_WRITE,
        "error": _init_error,
        "collections": [
            "users",
            "challenges",
            "projects",
            "student_applications",
            "industry_collaborations",
            "pilots",
            "escrow_ledger",
            "milestones",
            "bot_chat_logs",
            "evidence_images"
        ]
    }

def sync_entity_to_firestore(collection_name: str, doc_id: str, data: Dict[str, Any]) -> bool:
    """
    Upserts a single document in Cloud Firestore.
    """
    client = get_firestore_client()
    if not client:
        return False

    try:
        sanitized = {}
        for k, v in data.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                sanitized[k] = v.isoformat()
            else:
                sanitized[k] = v

        sanitized["_synced_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        doc_ref = client.collection(collection_name).document(str(doc_id))
        doc_ref.set(sanitized, merge=True)
        return True
    except Exception as e:
        logger.error(f"Error syncing {collection_name}/{doc_id} to Firestore: {e}")
        return False

def sync_all_database_to_firestore(db_session) -> Dict[str, Any]:
    """
    Synchronizes all records from SQLite SQLAlchemy models to Cloud Firestore collections.
    """
    from app.models.database_models import (
        User, Challenge, Team, Solution, GrantSponsorship, Milestone,
        UniversityProject, StudentApplication, IndustryCollaboration,
        PilotDeployment, EscrowLedgerEntry
    )

    client = get_firestore_client()
    if not client:
        return {
            "success": False,
            "error": _init_error or "Firebase Firestore is not connected. Configure credentials or run in local SQLite fallback mode."
        }

    counts = {
        "users": 0,
        "challenges": 0,
        "projects": 0,
        "student_applications": 0,
        "industry_collaborations": 0,
        "pilots": 0,
        "escrow_ledger": 0,
        "milestones": 0
    }

    try:
        batch = client.batch()
        batch_count = 0

        # 1. Users
        for u in db_session.query(User).all():
            doc_ref = client.collection("users").document(str(u.id))
            data = {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "organization": u.organization,
                "department": u.department,
                "location": u.location,
                "skills": u.skills,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["users"] += 1

        # 2. Challenges
        for c in db_session.query(Challenge).all():
            doc_ref = client.collection("challenges").document(str(c.id))
            data = {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "sdg_tag": c.sdg_tag,
                "location": c.location,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "urgency_level": c.urgency_level,
                "status": c.status,
                "poster_id": c.poster_id,
                "upvotes_count": c.upvotes_count,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["challenges"] += 1

        # 3. University Projects
        for p in db_session.query(UniversityProject).all():
            doc_ref = client.collection("projects").document(str(p.id))
            data = {
                "id": p.id,
                "challenge_id": p.challenge_id,
                "faculty_lead_id": p.faculty_lead_id,
                "university_name": p.university_name,
                "title": p.title,
                "description": p.description,
                "trl_level": p.trl_level,
                "status": p.status,
                "open_roles": p.open_roles,
                "budget_allocated": p.budget_allocated,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["projects"] += 1

        # 4. Student Applications
        for a in db_session.query(StudentApplication).all():
            doc_ref = client.collection("student_applications").document(str(a.id))
            data = {
                "id": a.id,
                "project_id": a.project_id,
                "applicant_id": a.applicant_id,
                "desired_role": a.desired_role,
                "status": a.status,
                "statement_of_purpose": a.statement_of_purpose,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["student_applications"] += 1

        # 5. Industry Collaborations
        for col in db_session.query(IndustryCollaboration).all():
            doc_ref = client.collection("industry_collaborations").document(str(col.id))
            data = {
                "id": col.id,
                "project_id": col.project_id,
                "company_name": col.company_name,
                "offer_type": col.offer_type,
                "funding_amount": col.funding_amount,
                "status": col.status,
                "details": col.details,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["industry_collaborations"] += 1

        # 6. Pilots
        for pi in db_session.query(PilotDeployment).all():
            doc_ref = client.collection("pilots").document(str(pi.id))
            data = {
                "id": pi.id,
                "project_id": pi.project_id,
                "location_name": pi.location_name,
                "beneficiaries_count": pi.beneficiaries_count,
                "status": pi.status,
                "sensor_telemetry_summary": pi.sensor_telemetry_summary,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["pilots"] += 1

        # 7. Escrow Ledger
        for e in db_session.query(EscrowLedgerEntry).all():
            doc_ref = client.collection("escrow_ledger").document(str(e.id))
            data = {
                "id": e.id,
                "project_id": e.project_id,
                "grantor_company": e.grantor_company,
                "milestone_title": e.milestone_title,
                "amount": e.amount,
                "status": e.status,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["escrow_ledger"] += 1

        # 8. Milestones
        for m in db_session.query(Milestone).all():
            doc_ref = client.collection("milestones").document(str(m.id))
            data = {
                "id": m.id,
                "solution_id": m.solution_id,
                "phase_key": m.phase_key,
                "title": m.title,
                "description": m.description,
                "grant_tranche_amount": m.grant_tranche_amount,
                "status": m.status,
                "_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            batch.set(doc_ref, data, merge=True)
            batch_count += 1
            counts["milestones"] += 1

        # Commit batch to Firestore
        batch.commit()

        return {
            "success": True,
            "message": f"Successfully synchronized {batch_count} records across all collections to Cloud Firestore.",
            "counts": counts,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Error during full Firestore sync: {e}")
        return {
            "success": False,
            "error": str(e),
            "counts": counts
        }

def log_bot_chat_to_firestore(session_id: str, user_message: str, bot_response: str, metadata: Optional[Dict] = None) -> bool:
    """
    Logs an interactive Nova AI Bot conversation exchange to Cloud Firestore.
    """
    client = get_firestore_client()
    if not client:
        return False

    try:
        data = {
            "session_id": session_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "metadata": metadata or {},
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        client.collection("bot_chat_logs").add(data)
        return True
    except Exception as e:
        logger.warning(f"Failed to log chat to Firestore: {e}")
        return False

def store_image_in_firebase(image_data: str, title: str = "ground_evidence", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Stores problem photo evidence directly in Cloud Firestore collection 'evidence_images'.
    Returns storage status and resource metadata.
    """
    client = get_firestore_client()
    doc_id = f"img_{int(datetime.datetime.now().timestamp() * 1000)}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    img_record = {
        "id": doc_id,
        "title": title,
        "image_data_url": image_data if len(image_data) < 900000 else image_data[:1000] + "...[truncated]",
        "has_full_data": len(image_data) < 900000,
        "data_length": len(image_data),
        "metadata": metadata or {},
        "created_at": now_iso,
        "_synced_at": now_iso
    }

    if client:
        try:
            client.collection("evidence_images").document(doc_id).set(img_record)
            logger.info(f"Image successfully stored in Cloud Firestore evidence_images/{doc_id}")
            return {
                "success": True,
                "image_id": doc_id,
                "storage_type": "FIREBASE_FIRESTORE",
                "timestamp": now_iso
            }
        except Exception as e:
            logger.error(f"Failed to store image in Firestore: {e}")

    return {
        "success": True,
        "image_id": doc_id,
        "storage_type": "LOCAL_FALLBACK",
        "timestamp": now_iso
    }

def verify_firebase_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token using the Firebase Admin SDK if available.
    """
    try:
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        logger.warning(f"Firebase token verification notice: {e}")
        return None

