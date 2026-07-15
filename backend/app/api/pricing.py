from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, require_superadmin
from app.models.user import User
from app.models.pricing_plan import PricingPlan, Subscription, UsageTracking
from app.models.lead import Lead
from app.models.itinerary import Itinerary
from app.models.tools import HotelVoucher, Invoice

router = APIRouter()


class PricingPlanOut(BaseModel):
    id: int
    name: str
    monthly_price: float
    itineraries_limit: int
    leads_limit: int
    vouchers_limit: int
    bills_limit: int
    team_members_limit: int
    storage_gb: int
    trial_days: int
    is_active: bool

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

    plan = PricingPlan(
        name=payload.name,
        monthly_price=payload.monthly_price,
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
    if payload.monthly_price is not None:
        plan.monthly_price = payload.monthly_price
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

    # Check trial expiry and update status if needed
    now = datetime.now(timezone.utc)
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        subscription.status = "expired"
        db.commit()

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        subscription.status = "expired"
        db.commit()

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
        "monthly_price": plan.monthly_price,
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

    now = datetime.now(timezone.utc)
    is_expired = False

    # Check trial expiry
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        is_expired = True
        if subscription.status != "expired":
            subscription.status = "expired"
            db.commit()

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        is_expired = True
        if subscription.status != "expired":
            subscription.status = "expired"
            db.commit()

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

    now = datetime.now(timezone.utc)

    # Check trial expiry
    if subscription.trial_ends_at and subscription.trial_ends_at <= now:
        subscription.status = "expired"
        db.commit()
        return False, "Trial period has expired. You can only read existing data. Please upgrade your plan."

    # Check paid plan renewal date expiry
    if subscription.renewal_date and subscription.renewal_date <= now:
        subscription.status = "expired"
        db.commit()
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
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")

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
    if subscription.trial_ends_at and datetime.now(timezone.utc) > subscription.trial_ends_at:
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
