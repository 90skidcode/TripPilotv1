from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    HALF_YEARLY = "half_yearly"
    YEARLY = "yearly"


class PricingPlan(Base):
    __tablename__ = "pricing_plans"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)  # Free Trial, Starter, Pro, Enterprise
    itineraries_limit = Column(Integer, nullable=False)
    leads_limit = Column(Integer, nullable=False)
    vouchers_limit = Column(Integer, nullable=False)
    bills_limit = Column(Integer, nullable=False)
    team_members_limit = Column(Integer, nullable=False)
    storage_gb = Column(Integer, default=1)
    trial_days = Column(Integer, default=0)  # 7 for Free Trial, 0 for paid
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    billing_cycles = relationship("PlanBillingCycle", back_populates="plan", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="plan", foreign_keys="Subscription.plan_id")


class PlanBillingCycle(Base):
    __tablename__ = "plan_billing_cycles"

    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("pricing_plans.id"), nullable=False)
    billing_cycle = Column(String(20), nullable=False)  # values from BillingCycle enum
    monthly_price = Column(Float, nullable=False)  # Base price in INR
    discount_percent = Column(Float, default=0)  # 0-100
    display_price = Column(String(100), nullable=False)  # e.g., "₹999/month" or "₹8,000/year"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plan = relationship("PricingPlan", back_populates="billing_cycles")


class Subscription(Base):
    """One subscription per organization.

    Lifecycle: trialing -> active -> past_due (grace period) -> expired.
    Payments are offline; renewal invoices (SubscriptionInvoice) drive the
    period advance. `pending_plan_id` holds a scheduled downgrade that takes
    effect at the next renewal.
    """

    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, unique=True, index=True)
    plan_id = Column(Integer, ForeignKey("pricing_plans.id"), nullable=False)
    pending_plan_id = Column(Integer, ForeignKey("pricing_plans.id"), nullable=True)  # downgrade applied at renewal
    plan_billing_cycle_id = Column(Integer, ForeignKey("plan_billing_cycles.id"), nullable=True)
    billing_cycle = Column(String(20), nullable=True)  # values from BillingCycle enum: monthly, quarterly, half_yearly, yearly
    status = Column(String(20), default="active")  # trialing, active, past_due, expired, cancelled
    start_date = Column(DateTime, default=datetime.utcnow)
    renewal_date = Column(DateTime, nullable=True)  # current period end (next billing date)
    trial_ends_at = Column(DateTime, nullable=True)  # NULL for paid plans
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plan = relationship("PricingPlan", back_populates="subscriptions", foreign_keys=[plan_id])
    pending_plan = relationship("PricingPlan", foreign_keys=[pending_plan_id])
    plan_billing_cycle = relationship("PlanBillingCycle")
