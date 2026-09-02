import sqlite3
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def auto_migrate_sqlite():
    """Ensures newly added columns exist in SQLite database if schema was extended."""
    if not "sqlite" in settings.DATABASE_URL:
        return
    
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(users)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            new_columns = [
                ("password_hash", "TEXT"),
                ("first_name", "TEXT"),
                ("last_name", "TEXT"),
                ("phone", "TEXT"),
                ("location", "TEXT"),
                ("is_verified", "BOOLEAN DEFAULT 1")
            ]
            for col_name, col_type in new_columns:
                if col_name not in existing_cols:
                    try:
                        cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                    except Exception:
                        pass
        
        # Check challenges table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='challenges'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(challenges)")
            existing_ch_cols = [row[1] for row in cursor.fetchall()]
            if "domain" not in existing_ch_cols:
                try:
                    cursor.execute("ALTER TABLE challenges ADD COLUMN domain TEXT DEFAULT 'urban_infrastructure'")
                except Exception:
                    pass
            if "moderation_status" not in existing_ch_cols:
                try:
                    cursor.execute("ALTER TABLE challenges ADD COLUMN moderation_status TEXT DEFAULT 'APPROVED'")
                except Exception:
                    pass
                    
        conn.commit()
        conn.close()
    except Exception:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
