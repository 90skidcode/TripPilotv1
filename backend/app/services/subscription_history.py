"""Subscription-history helper for the billing timeline.

Call ``log_subscription_event(...)`` after the caller has committed its own
changes. It commits the event in its own transaction and never raises — a
logging failure must not break the operation that triggered it.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.subscription_history import SubscriptionHistory


def log_subscription_event(
    db: Session,
    *,
    org_id: int,
    action: str,
    subscription_id: Optional[int] = None,
    old_plan_id: Optional[int] = None,
    new_plan_id: Optional[int] = None,
    plan_name: Optional[str] = None,
    billing_cycle: Optional[str] = None,
    old_renewal_date: Optional[datetime] = None,
    new_renewal_date: Optional[datetime] = None,
    amount: Optional[float] = None,
    payment_mode: Optional[str] = None,
    payment_reference: Optional[str] = None,
    note: Optional[str] = None,
    actor_id: Optional[int] = None,
    actor_name: Optional[str] = None,
) -> Optional[SubscriptionHistory]:
    try:
        event = SubscriptionHistory(
            org_id=org_id,
            subscription_id=subscription_id,
            action=action,
            old_plan_id=old_plan_id,
            new_plan_id=new_plan_id,
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            old_renewal_date=old_renewal_date,
            new_renewal_date=new_renewal_date,
            amount=amount,
            payment_mode=payment_mode,
            payment_reference=payment_reference,
            note=note,
            actor_id=actor_id,
            actor_name=actor_name,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception as exc:  # never let logging break the caller
        db.rollback()
        print(f"[subscription_history] failed to log event: {exc}")
        return None
