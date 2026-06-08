"""Activity-log helper for the lead timeline.

Call ``log_activity(...)`` after a successful operation. It commits the
activity in its own transaction and never raises — a logging failure must
not break the operation that triggered it.
"""
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.models.activity import LeadActivity


def log_activity(
    db: Session,
    *,
    org_id: int,
    lead_id: int,
    type: str,
    title: str,
    actor_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    description: Optional[str] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[int] = None,
    meta: Optional[Any] = None,
) -> Optional[LeadActivity]:
    try:
        activity = LeadActivity(
            org_id=org_id,
            lead_id=lead_id,
            customer_id=customer_id,
            actor_id=actor_id,
            type=type,
            title=title,
            description=description,
            ref_type=ref_type,
            ref_id=ref_id,
            meta=meta,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as exc:  # never let logging break the caller
        db.rollback()
        print(f"[activity] failed to log activity: {exc}")
        return None
