"""
Firebase Sync & Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.database.db import get_db
from app.database.firebase_db import (
    get_firebase_status,
    sync_all_database_to_firestore,
    get_firestore_client,
    log_bot_chat_to_firestore,
    init_firebase
)
from app.config import settings

router = APIRouter(prefix="/api/firebase", tags=["Firebase Cloud Database"])

class FirebaseConfigPayload(BaseModel):
    api_key: Optional[str] = None
    project_id: Optional[str] = None
    auth_domain: Optional[str] = None
    storage_bucket: Optional[str] = None
    credentials_path: Optional[str] = None
    database_url: Optional[str] = None

@router.get("/status")
def firebase_connection_status():
    """
    Get current Firebase Cloud Firestore connection status and diagnostic details.
    """
    return get_firebase_status()

@router.get("/client-config")
def get_firebase_client_config():
    """
    Returns public Firebase client configuration to initialize web SDK with custom API Key.
    """
    return {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN or f"{settings.FIREBASE_PROJECT_ID}.firebaseapp.com",
        "projectId": settings.FIREBASE_PROJECT_ID or "impactbridge-app",
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET or f"{settings.FIREBASE_PROJECT_ID}.appspot.com",
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID
    }

@router.post("/config")
def update_firebase_config(payload: FirebaseConfigPayload):
    """
    Update runtime Firebase settings & API Key and re-attempt connection.
    """
    if payload.api_key:
        settings.FIREBASE_API_KEY = payload.api_key
    if payload.project_id:
        settings.FIREBASE_PROJECT_ID = payload.project_id
    if payload.auth_domain:
        settings.FIREBASE_AUTH_DOMAIN = payload.auth_domain
    if payload.storage_bucket:
        settings.FIREBASE_STORAGE_BUCKET = payload.storage_bucket
    if payload.credentials_path:
        settings.FIREBASE_CREDENTIALS_PATH = payload.credentials_path
    if payload.database_url:
        settings.FIREBASE_DATABASE_URL = payload.database_url

    # Re-initialize
    init_firebase()
    
    return {
        "status": "success",
        "message": "Firebase configuration and API key updated successfully",
        "config": get_firebase_client_config(),
        "connection": get_firebase_status()
    }

@router.post("/sync")
def trigger_firestore_sync(db: Session = Depends(get_db)):
    """
    Sync all relational database entities directly into Cloud Firestore collections.
    """
    status = get_firebase_status()
    result = sync_all_database_to_firestore(db)
    return result

@router.get("/collections/{collection_name}")
def get_firestore_collection(collection_name: str, limit: int = 50):
    """
    Fetch documents from a specific Cloud Firestore collection.
    """
    client = get_firestore_client()
    if not client:
        raise HTTPException(
            status_code=400,
            detail="Firebase Firestore is not connected."
        )

    try:
        docs_ref = client.collection(collection_name).limit(limit).stream()
        docs = []
        for doc in docs_ref:
            d = doc.to_dict()
            d["_id"] = doc.id
            docs.append(d)
        return {
            "collection": collection_name,
            "count": len(docs),
            "documents": docs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading Firestore collection: {str(e)}")

@router.post("/chat-log")
def log_chat_message(
    session_id: str = Body(...),
    user_message: str = Body(...),
    bot_response: str = Body(...),
    metadata: Optional[Dict[str, Any]] = Body(None)
):
    """
    Log an interactive conversation exchange with Nova AI Bot to Cloud Firestore.
    """
    success = log_bot_chat_to_firestore(session_id, user_message, bot_response, metadata)
    return {"success": success}
