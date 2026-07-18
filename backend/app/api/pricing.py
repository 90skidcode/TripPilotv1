from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_superadmin
from app.models.user import User
from app.models.pricing_plan import PricingPlan, Subscription, UsageTracking, PlanBillingCycle, BillingCycle
from app.models.subscription_history import SubscriptionHistory
from app.services.subscription_history import log_subscription_event
from app.models.lead import Lead
from app.models.itinerary import Itinerary
from app.models.tools import HotelVoucher, Invoice

router = APIRouter()


CYCLE_DAYS = {"monthly": 30, "quarterly": 90, "half_yearly": 180, "yearly": 365}


def calculate_renewal_date(billing_cycle: str) -> datetime:
    """Calculate renewal date based on billing cycle."""
    return datetime.utcnow() + timedelta(days=CYCLE_DAYS.get(billing_cycle, 30))


def mark_expired(db: Session, subscription: Subscription) -> None:
    """Flip a lapsed subscription to expired, logging the timeline event once."""
    if subscription.status == "expired":
        return
    old = subscription.renewal_date or subscription.trial_ends_at
    subscription.status = "expired"
    db.commit()
    log_subscription_event(
        db,
        org_id=subscription.org_id,
        subscription_id=subscription.id,
        action="expired",
        old_renewal_date=old,
        new_renewal_date=old,
        actor_id=None,
        actor_name="System",
    )


class PlanBillingCycleOut(BaseModel):
    id: int
    plan_id: int
    billing_cycle: str
    monthly_price: float
    discount_percent: float
    display_price: str
    is_active: bool

    class Config:
        from_attributes = True


class PricingPlanOut(BaseModel):
    id: int
    name: str
    itineraries_limit: int
    leads_limit: int
    vouchers_limit: int
    bills_limit: int
    team_members_limit: int
    storage_gb: int
    trial_days: int
    is_active: bool
    billing_cycles: List[PlanBillingCycleOut] = []

    class Config:
        from_attributes = True


class PlanBillingCycleCreate(BaseModel):
    billing_cycle: str  # monthly, quarterly, half_yearly, yearly
    monthly_price: float
    discount_percent: float = 0
    display_price: str


class SubscriptionCreatePayload(BaseModel):
    plan_id: int
    plan_billing_cycle_id: int
    billing_cycle: str  # monthly, quarterly, half_yearly, yearly


class SubscriptionOut(BaseModel):
    id: int
    org_id: int
    plan_id: int
    billing_cycle: str | None
    status: str
    start_date: datetime
    renewal_date: datetime | None
    trial_ends_at: datetime | None

    class Config:
        from_attributes = True


class UsageOut(BaseModel):
    itineraries_used: int
    itineraries_limit: int
    leads_used: int
    leads_limit: int
    vouchers_used: int
    vouchers_limit: int
    bills_used: int
    bills_limit: int
    team_members_used: int
    team_members_limit: int
    plan_name: str
    monthly_price: float
    subscription_status: str
    renewal_date: str | None
    trial_ends_at: str | None
    days_left_in_trial: int | None

    class Config:
        from_attributes = True


@router.get("/plans", response_model=list[PricingPlanOut])
def list_plans(db: Session = Depends(get_db)):
    """Get all available pricing plans."""
    plans = db.query(PricingPlan).filter(PricingPlan.is_active == True).all()
    return plans


@router.get("/plans/all", response_model=list[PricingPlanOut])
def list_all_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get all pricing plans (including inactive) - superadmin only."""
    plans = db.query(PricingPlan).all()
    return plans


class PricingPlanCreate(BaseModel):
    name: str
    monthly_price: float
    itineraries_limit: int
    leads_limit: int
    vouchers_limit: int
    bills_limit: int
    team_members_limit: int
    storage_gb: int = 1
    trial_days: int = 0


class PricingPlanUpdate(BaseModel):
    name: str | None = None
    monthly_price: float | None = None
    itineraries_limit: int | None = None
    leads_limit: int | None = None
    vouchers_limit: int | None = None
    bills_limit: int | None = None
    team_members_limit: int | None = None
    storage_gb: int | None = None
    trial_days: int | None = None
    is_active: bool | None = None


@router.post("/plans", response_model=PricingPlanOut, status_code=201)
def create_plan(
    payload: PricingPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create a new pricing plan - superadmin only."""
    # Check if plan name already exists
    existing = db.query(PricingPlan).filter(PricingPlan.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan name already exists"
        )

    # Note: monthly_price is accepted for API compatibility but pricing
    # actually lives on PlanBillingCycle rows, not the plan itself.
    plan = PricingPlan(
        name=payload.name,
        itineraries_limit=payload.itineraries_limit,
        leads_limit=payload.leads_limit,
        vouchers_limit=payload.vouchers_limit,
        bills_limit=payload.bills_limit,
        team_members_limit=payload.team_members_limit,
        storage_gb=payload.storage_gb,
        trial_days=payload.trial_days,
        is_active=True,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/plans/{plan_id}", response_model=PricingPlanOut)
def update_plan(
    plan_id: int,
    payload: PricingPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update a pricing plan - superadmin only."""
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    # Check if new name already exists
    if payload.name and payload.name != plan.name:
        existing = db.query(PricingPlan).filter(PricingPlan.name == payload.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plan name already exists"
            )

    # Update fields
    if payload.name is not None:
        plan.name = payload.name
    if payload.itineraries_limit is not None:
        plan.itineraries_limit = payload.itineraries_limit
    if payload.leads_limit is not None:
        plan.leads_limit = payload.leads_limit
    if payload.vouchers_limit is not None:
        plan.vouchers_limit = payload.vouchers_limit
    if payload.bills_limit is not None:
        plan.bills_limit = payload.bills_limit
    if payload.team_members_limit is not None:
        plan.team_members_limit = payload.team_members_limit
    if payload.storage_gb is not None:
        plan.storage_gb = payload.storage_gb
    if payload.trial_days is not None:
        plan.trial_days = payload.trial_days
    if payload.is_active is not None:
        plan.is_active = payload.is_active

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Delete a pricing plan (soft delete - sets is_active to False) - superadmin only."""
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    # Soft delete
    plan.is_active = False
    db.commit()
    return None


# ─── Billing Cycles ──────────────────────────────────────────────────────────

@router.get("/plans/{plan_id}/billing-cycles", response_model=list[PlanBillingCycleOut])
def get_plan_billing_cycles(
    plan_id: int,
    db: Session = Depends(get_db),
):
    """Get all billing cycles for a plan."""
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    cycles = db.query(PlanBillingCycle).filter(
        PlanBillingCycle.plan_id == plan_id,
        PlanBillingCycle.is_active == True,
    ).all()
    return cycles


@router.post("/plans/{plan_id}/billing-cycles", response_model=PlanBillingCycleOut, status_code=201)
def create_billing_cycle(
    plan_id: int,
    payload: PlanBillingCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create a billing cycle for a plan."""
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Check if cycle already exists
    existing = db.query(PlanBillingCycle).filter(
        PlanBillingCycle.plan_id == plan_id,
        PlanBillingCycle.billing_cycle == payload.billing_cycle,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Billing cycle already exists for this plan")

    cycle = PlanBillingCycle(
        plan_id=plan_id,
        billing_cycle=payload.billing_cycle,
        monthly_price=payload.monthly_price,
        discount_percent=payload.discount_percent,
        display_price=payload.display_price,
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


@router.put("/billing-cycles/{cycle_id}", response_model=PlanBillingCycleOut)
def update_billing_cycle(
    cycle_id: int,
    payload: PlanBillingCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update a billing cycle."""
    cycle = db.query(PlanBillingCycle).filter(PlanBillingCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Billing cycle not found")

    cycle.billing_cycle = payload.billing_cycle
    cycle.monthly_price = payload.monthly_price
    cycle.discount_percent = payload.discount_percent
    cycle.display_price = payload.display_price
    db.commit()
    db.refresh(cycle)
    return cycle


@router.delete("/billing-cycles/{cycle_id}", status_code=204)
def delete_billing_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Delete a billing cycle (soft delete)."""
    cycle = db.query(PlanBillingCycle).filter(PlanBillingCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Billing cycle not found")

    cycle.is_active = False
    db.commit()
    return None


# ─── Subscriptions ──────────────────────────────────────────────────────────

@router.post("/subscriptions", response_model=SubscriptionOut, status_code=201)
def create_or_update_subscription(
    payload: SubscriptionCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update organization subscription with billing cycle.

    Payments are collected offline — paid plans are activated and renewed
    only by the TripPilot team from the admin panel. Self-serve is limited
    to trial plans.
    """
    org_id = current_user.org_id

    # Verify plan and billing cycle exist
    plan = db.query(PricingPlan).filter(PricingPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan.trial_days == 0 and not current_user.is_superadmin:
        raise HTTPException(
            status_code=403,
            detail="Paid plans are activated by the TripPilot team. Please contact support to renew or upgrade.",
        )

    billing_cycle = db.query(PlanBillingCycle).filter(
        PlanBillingCycle.id == payload.plan_billing_cycle_id,
        PlanBillingCycle.plan_id == payload.plan_id,
    ).first()
    if not billing_cycle:
        raise HTTPException(status_code=404, detail="Billing cycle not found for this plan")

    # Check if subscription already exists
    existing = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial"]),
    ).order_by(Subscription.id.desc()).first()

    now = datetime.utcnow()
    renewal_date = calculate_renewal_date(payload.billing_cycle)

    old_plan_id = existing.plan_id if existing else None
    old_renewal = (existing.renewal_date or existing.trial_ends_at) if existing else None

    if existing:
        # Update existing subscription
        existing.plan_id = payload.plan_id
        existing.plan_billing_cycle_id = payload.plan_billing_cycle_id
        existing.billing_cycle = payload.billing_cycle
        existing.status = "active"
        existing.start_date = now
        # Only set renewal_date for paid plans (not trial)
        if plan.trial_days > 0:
            existing.trial_ends_at = now + timedelta(days=plan.trial_days)
            existing.renewal_date = None
        else:
            existing.renewal_date = renewal_date
            existing.trial_ends_at = None
        db.commit()
        db.refresh(existing)
        subscription = existing
    else:
        # Create new subscription
        subscription = Subscription(
            org_id=org_id,
            plan_id=payload.plan_id,
            plan_billing_cycle_id=payload.plan_billing_cycle_id,
            billing_cycle=payload.billing_cycle,
            status="active",
            start_date=now,
        )
        # Set trial/renewal dates based on plan type
        if plan.trial_days > 0:
            subscription.trial_ends_at = now + timedelta(days=plan.trial_days)
        else:
            subscription.renewal_date = renewal_date
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

    log_subscription_event(
        db,
        org_id=org_id,
        subscription_id=subscription.id,
        action="activated",
        old_plan_id=old_plan_id,
        new_plan_id=plan.id,
        plan_name=plan.name,
        billing_cycle=subscription.billing_cycle,
        old_renewal_date=old_renewal,
        new_renewal_date=subscription.renewal_date or subscription.trial_ends_at,
        actor_id=current_user.id,
        actor_name=current_user.name,
    )
    return subscription


@router.get("/subscriptions/current", response_model=SubscriptionOut)
def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current organization subscription."""
    org_id = current_user.org_id

    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial", "expired"]),
    ).order_by(Subscription.id.desc()).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")

    return subscription


class BillingHistoryItemOut(BaseModel):
    id: int
    action: str
    plan_name: str | None
    billing_cycle: str | None
    old_renewal_date: str | None
    new_renewal_date: str | None
    amount: float | None
    payment_mode: str | None
    payment_reference: str | None
    note: str | None
    created_at: str | None


@router.get("/subscriptions/history", response_model=List[BillingHistoryItemOut])
def get_billing_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Billing timeline for the user's own organization.

    Intentionally excludes actor details — admin actions are shown to
    tenants as coming from the TripPilot team.
    """
    events = db.query(SubscriptionHistory).filter(
        SubscriptionHistory.org_id == current_user.org_id
    ).order_by(
        SubscriptionHistory.created_at.desc(), SubscriptionHistory.id.desc()
    ).limit(limit).all()

    return [
        {
            "id": e.id,
            "action": e.action,
            "plan_name": e.plan_name,
            "billing_cycle": e.billing_cycle,
            "old_renewal_date": e.old_renewal_date.isoformat() if e.old_renewal_date else None,
            "new_renewal_date": e.new_renewal_date.isoformat() if e.new_renewal_date else None,
            "amount": e.amount,
            "payment_mode": e.payment_mode,
            "payment_reference": e.payment_reference,
            "note": e.note,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@router.get("/usage", response_model=UsageOut)
def get_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current usage for the user's organization."""
    org_id = current_user.org_id

    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial"]),
    ).first()

    if not subscription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription found")

    plan = db.query(PricingPlan).filter(PricingPlan.id == subscription.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    # Get billing cycle pricing if available
    monthly_price = 0
    if subscription.plan_billing_cycle_id:
        billing_cycle = db.query(PlanBillingCycle).filter(
            PlanBillingCycle.id == subscription.plan_billing_cycle_id
        ).first()
        if billing_cycle:
            monthly_price = billing_cycle.monthly_price

    # Check trial/renewal expiry and update status if needed
    now = datetime.utcnow()
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        mark_expired(db, subscription)

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        mark_expired(db, subscription)

    # Count actual records — source of truth, always accurate regardless of deletes/imports
    leads_used = db.query(func.count(Lead.id)).filter(Lead.org_id == org_id).scalar() or 0
    itineraries_used = db.query(func.count(Itinerary.id)).filter(Itinerary.org_id == org_id).scalar() or 0
    vouchers_used = db.query(func.count(HotelVoucher.id)).filter(HotelVoucher.org_id == org_id).scalar() or 0
    bills_used = db.query(func.count(Invoice.id)).filter(Invoice.org_id == org_id).scalar() or 0
    team_members_used = db.query(func.count(User.id)).filter(User.org_id == org_id, User.is_active == True).scalar() or 0  # noqa: E712

    # Determine effective status: show "trial" when trial_ends_at is in the future
    if subscription.trial_ends_at and subscription.trial_ends_at > now:
        effective_status = "trial"
    else:
        effective_status = subscription.status

    days_left_in_trial = None
    if subscription.trial_ends_at:
        days_left_in_trial = max(0, (subscription.trial_ends_at - now).days)

    return {
        "itineraries_used": itineraries_used,
        "itineraries_limit": plan.itineraries_limit,
        "leads_used": leads_used,
        "leads_limit": plan.leads_limit,
        "vouchers_used": vouchers_used,
        "vouchers_limit": plan.vouchers_limit,
        "bills_used": bills_used,
        "bills_limit": plan.bills_limit,
        "team_members_used": team_members_used,
        "team_members_limit": plan.team_members_limit,
        "plan_name": plan.name,
        "monthly_price": monthly_price,
        "subscription_status": effective_status,
        "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "days_left_in_trial": days_left_in_trial,
    }


class SubscriptionStatusOut(BaseModel):
    is_expired: bool
    days_left_in_trial: int | None
    trial_ends_at: str | None
    status: str


@router.get("/subscription-status", response_model=SubscriptionStatusOut)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get subscription status including trial & paid plan expiry."""
    org_id = current_user.org_id

    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial", "expired"]),
    ).first()

    if not subscription:
        return {
            "is_expired": True,
            "days_left_in_trial": None,
            "trial_ends_at": None,
            "status": "no_subscription",
        }

    now = datetime.utcnow()
    is_expired = False

    # Check trial expiry
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        is_expired = True
        mark_expired(db, subscription)

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        is_expired = True
        mark_expired(db, subscription)

    # Check explicit expired status
    if subscription.status == "expired":
        is_expired = True

    days_left_in_trial = None
    if subscription.trial_ends_at:
        days_left_in_trial = max(0, (subscription.trial_ends_at - now).days)

    return {
        "is_expired": is_expired,
        "days_left_in_trial": days_left_in_trial,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "status": subscription.status,
    }


def check_write_access(db: Session, org_id: int) -> tuple[bool, str | None]:
    """
    Check if organization has write access (trial not expired & subscription active).
    Returns: (has_write_access: bool, expiration_message: str | None)
    """
    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial", "expired"]),
    ).first()

    if not subscription:
        return False, "No active subscription found"

    now = datetime.utcnow()

    # Check trial expiry
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        mark_expired(db, subscription)
        return False, "Trial period has expired. You can only read existing data. Please upgrade your plan."

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        mark_expired(db, subscription)
        return False, "Subscription has expired. You can only read existing data. Please renew your plan."

    # Check explicit expired status
    if subscription.status == "expired":
        return False, "Subscription has expired. You can only read existing data. Please renew your plan."

    # Active subscription with valid dates
    if subscription.status in ["active", "trial"]:
        return True, None

    return False, "Subscription status is not active."


def check_plan_limit(
    db: Session,
    org_id: int,
    resource_type: str,  # itineraries, leads, vouchers, bills, team_members
) -> tuple[bool, str, int, int]:
    """
    Check if organization can create a new resource based on plan limits.
    Returns: (allowed: bool, error_message: str, current_usage: int, limit: int)
    """
    # First check write access
    has_write, write_error = check_write_access(db, org_id)
    if not has_write:
        return False, write_error or "No write access", 0, 0

    # Get subscription
    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status.in_(["active", "trial"]),
    ).first()

    if not subscription:
        return False, "No active subscription found", 0, 0

    plan = db.query(PricingPlan).filter(PricingPlan.id == subscription.plan_id).first()
    if not plan:
        return False, "Plan not found", 0, 0

    # Count actual records — source of truth
    resource_counts = {
        "leads": db.query(func.count(Lead.id)).filter(Lead.org_id == org_id).scalar() or 0,
        "itineraries": db.query(func.count(Itinerary.id)).filter(Itinerary.org_id == org_id).scalar() or 0,
        "vouchers": db.query(func.count(HotelVoucher.id)).filter(HotelVoucher.org_id == org_id).scalar() or 0,
        "bills": db.query(func.count(Invoice.id)).filter(Invoice.org_id == org_id).scalar() or 0,
        "team_members": db.query(func.count(User.id)).filter(User.org_id == org_id, User.is_active == True).scalar() or 0,  # noqa: E712
    }

    limit_map = {
        "leads": "leads_limit",
        "itineraries": "itineraries_limit",
        "vouchers": "vouchers_limit",
        "bills": "bills_limit",
        "team_members": "team_members_limit",
    }

    if resource_type not in resource_counts:
        return False, f"Unknown resource type: {resource_type}", 0, 0

    current_usage = resource_counts[resource_type]
    limit = getattr(plan, limit_map[resource_type], 0)

    if current_usage >= limit:
        resource_name = resource_type.replace("_", " ").title()
        return False, f"You have reached the maximum {resource_name} ({limit}) allowed by your plan. Please upgrade.", current_usage, limit

    return True, "", current_usage, limit


def increment_usage(
    db: Session,
    org_id: int,
    usage_type: str,  # itineraries, leads, vouchers, bills, team_members
) -> bool:
    """
    Increment usage counter. Returns True if successful, False if limit exceeded.
    """
    current_month = datetime.utcnow().strftime("%Y-%m")

    # Get usage record
    usage = db.query(UsageTracking).filter(
        UsageTracking.org_id == org_id,
        UsageTracking.month == current_month
    ).first()

    if not usage:
        usage = UsageTracking(org_id=org_id, month=current_month)
        db.add(usage)
        db.commit()
        db.refresh(usage)

    # Get plan limit
    subscription = db.query(Subscription).filter(
        Subscription.org_id == org_id,
        Subscription.status == "active"
    ).first()

    if not subscription:
        return False

    plan = db.query(PricingPlan).filter(PricingPlan.id == subscription.plan_id).first()

    if not plan:
        return False

    # Check if subscription is expired
    if subscription.status == "expired":
        return False

    # Check trial expiry
    if subscription.trial_ends_at and datetime.utcnow() > subscription.trial_ends_at:
        subscription.status = "expired"
        db.commit()
        return False

    # Get current usage and limits
    usage_field = f"{usage_type}_used"
    limit_field = f"{usage_type}_limit"

    current_usage = getattr(usage, usage_field, 0)
    limit = getattr(plan, limit_field, float('inf'))

    # Check if limit exceeded
    if limit != float('inf') and current_usage >= limit:
        return False

    # Increment usage
    setattr(usage, usage_field, current_usage + 1)
    db.commit()

    return True
