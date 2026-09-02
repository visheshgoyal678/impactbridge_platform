import datetime
from sqlalchemy.orm import Session
from app.models.database_models import ActivityLog

def log_activity(
    db: Session,
    actor_name: str,
    actor_role: str,
    action_type: str,
    title: str,
    description: str,
    entity_type: str = None,
    entity_id: int = None
) -> ActivityLog:
    """Logs an activity event in the database for the global real-time activity feed."""
    activity = ActivityLog(
        actor_name=actor_name,
        actor_role=actor_role,
        action_type=action_type,
        title=title,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
