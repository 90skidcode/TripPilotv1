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
    subscriptions = relationship("Subscription", back_populates="plan")


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
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False)  # Foreign key to Organization
    plan_id = Column(Integer, ForeignKey("pricing_plans.id"), nullable=False)
    plan_billing_cycle_id = Column(Integer, ForeignKey("plan_billing_cycles.id"), nullable=True)
    billing_cycle = Column(String(20), nullable=True)  # values from BillingCycle enum: monthly, quarterly, half_yearly, yearly
    status = Column(String(20), default="active")  # active, expired, cancelled
    start_date = Column(DateTime, default=datetime.utcnow)
    renewal_date = Column(DateTime, nullable=True)  # Next billing date
    trial_ends_at = Column(DateTime, nullable=True)  # NULL for paid plans
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plan = relationship("PricingPlan", back_populates="subscriptions")
    plan_billing_cycle = relationship("PlanBillingCycle")


class UsageTracking(Base):
    __tablename__ = "usage_tracking"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False)  # Foreign key to Organization
    month = Column(String(7), nullable=False)  # Format: "2026-05"
    itineraries_used = Column(Integer, default=0)
    leads_used = Column(Integer, default=0)
    vouchers_used = Column(Integer, default=0)
    bills_used = Column(Integer, default=0)
    team_members_used = Column(Integer, default=0)
    storage_used_mb = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # Unique constraint: one tracking record per org per month
        # This would need database-level unique(org_id, month)
    )
