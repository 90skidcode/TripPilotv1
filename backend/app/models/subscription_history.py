from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class SubscriptionHistory(Base):
    """Timeline of subscription events per organization — manual extensions
    recorded by superadmins (with offline payment details), plan changes,
    activations, and system-detected expiries."""

    __tablename__ = "subscription_history"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)  # matches Subscription.org_id (no FK there either)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True, index=True)

    action = Column(String(30), nullable=False)  # extended | created | plan_changed | expired | cancelled | activated
    old_plan_id = Column(Integer, nullable=True)
    new_plan_id = Column(Integer, nullable=True)
    plan_name = Column(String(50), nullable=True)  # snapshot of the (new) plan name
    billing_cycle = Column(String(20), nullable=True)
    old_renewal_date = Column(DateTime, nullable=True)  # renewal_date or trial_ends_at before the event
    new_renewal_date = Column(DateTime, nullable=True)

    # Offline payment capture (payments happen outside the app)
    amount = Column(Float, nullable=True)  # INR
    payment_mode = Column(String(20), nullable=True)  # upi | bank_transfer | cash | cheque | other
    payment_reference = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)

    actor_id = Column(Integer, nullable=True)  # null = system
    actor_name = Column(String(100), nullable=True)  # snapshot, survives user deletion
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
