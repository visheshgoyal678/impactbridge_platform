#!/usr/bin/env python3
"""
ImpactBridge — Cloud Firestore Database Sync Script
Synchronizes all SQLite relational tables (Users, Challenges, Teams, Solutions, Grants, Milestones)
directly to Google Cloud Firestore document collections.
"""

import sys
import os
import json

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from app.database.db import SessionLocal
from app.database.firebase_db import get_firebase_status, sync_all_database_to_firestore, init_firebase

def main():
    print("=" * 70)
    print("🔥 IMPACTBRIDGE ➔ FIREBASE CLOUD FIRESTORE SYNCHRONIZER")
    print("=" * 70)

    # 1. Check Status
    status = get_firebase_status()
    print(f"📦 firebase-admin installed:  {status['installed']}")
    print(f"🔑 Credentials File Found:    {status['credentials_found']} ({status['credentials_path']})")
    print(f"🌐 Project ID:                {status['project_id']}")
    print(f"📡 Connection Status:         {status['status']}")

    if not status["connected"]:
        print("\n⚠️  Firebase Firestore is not yet connected.")
        if not status["installed"]:
            print("👉 Run: pip install firebase-admin")
        print("👉 Make sure your 'firebase-service-account.json' key is present in the project folder,")
        print("   OR set FIREBASE_PROJECT_ID in your environment/.env file.\n")
        sys.exit(1)

    # 2. Perform Sync
    print("\n🚀 Starting full synchronization from SQLite to Cloud Firestore collections...")
    db = SessionLocal()
    try:
        result = sync_all_database_to_firestore(db)
        if result.get("success"):
            print("\n✅ SYNCHRONIZATION SUCCESSFUL!")
            print(f"📝 {result.get('message')}")
            print("\n📊 Synced Documents by Collection:")
            for col, count in result.get("counts", {}).items():
                print(f"   • {col.ljust(16)}: {count} documents")
            print(f"\n⏰ Timestamp: {result.get('timestamp')}")
        else:
            print(f"\n❌ Synchronization Failed: {result.get('error')}")
            sys.exit(1)
    finally:
        db.close()

    print("=" * 70)

if __name__ == "__main__":
    main()
