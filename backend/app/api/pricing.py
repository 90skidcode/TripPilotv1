from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_superadmin
from app.models.user import User
from app.models.pricing_plan import PricingPlan, Subscription, PlanBillingCycle, BillingCycle
from app.models.subscription_history import SubscriptionHistory
from app.models.subscription_invoice import SubscriptionInvoice
from app.services.subscription_history import log_subscription_event
from app.models.lead import Lead
from app.models.itinerary import Itinerary
from app.models.tools import HotelVoucher, Invoice

router = APIRouter()


CYCLE_DAYS = {"monthly": 30, "quarterly": 90, "half_yearly": 180, "yearly": 365}
CYCLE_MONTHS = {"monthly": 1, "quarterly": 3, "half_yearly": 6, "yearly": 12}

TRIAL_DAYS = 14  # every new agency starts with a 14-day full-featured trial
GRACE_DAYS = 7  # past_due grace window after the renewal date before access is cut
RENEWAL_NOTICE_DAYS = 7  # renewal invoices are generated this many days early

# Statuses that still have write access (past_due keeps access during grace)
WRITE_STATUSES = ("trialing", "active", "past_due")


def calculate_renewal_date(billing_cycle: str) -> datetime:
    """Calculate renewal date based on billing cycle."""
    return datetime.utcnow() + timedelta(days=CYCLE_DAYS.get(billing_cycle, 30))


def get_org_subscription(db: Session, org_id: int) -> Subscription | None:
    """The organization's subscription (newest row wins if legacy duplicates exist)."""
    return db.query(Subscription).filter(
        Subscription.org_id == org_id
    ).order_by(Subscription.id.desc()).first()


def compute_period_amount(db: Session, plan_id: int, billing_cycle: str) -> float:
    """Suggested charge for one period: per-month base x months x (1 - discount).

    Falls back to the plan's monthly price row when the specific cycle has no
    price configured; returns 0 when the plan has no prices (admin fills the
    amount in when recording the payment).
    """
    months = CYCLE_MONTHS.get(billing_cycle, 1)
    row = db.query(PlanBillingCycle).filter(
        PlanBillingCycle.plan_id == plan_id,
        PlanBillingCycle.billing_cycle == billing_cycle,
        PlanBillingCycle.is_active == True,  # noqa: E712
    ).first()
    if not row:
        row = db.query(PlanBillingCycle).filter(
            PlanBillingCycle.plan_id == plan_id,
            PlanBillingCycle.billing_cycle == "monthly",
            PlanBillingCycle.is_active == True,  # noqa: E712
        ).first()
    if not row:
        return 0.0
    return round(row.monthly_price * months * (1 - (row.discount_percent or 0) / 100), 2)


def ensure_renewal_invoice(db: Session, subscription: Subscription) -> None:
    """Generate the next renewal invoice once we're inside the notice window.

    Priced at the pending (downgrade) plan when one is scheduled. No-op if an
    open renewal invoice already exists for this subscription.
    """
    if subscription.status not in ("active", "past_due") or not subscription.renewal_date:
        return
    now = datetime.utcnow()
    if subscription.renewal_date - timedelta(days=RENEWAL_NOTICE_DAYS) > now:
        return
    open_invoice = db.query(SubscriptionInvoice).filter(
        SubscriptionInvoice.subscription_id == subscription.id,
        SubscriptionInvoice.invoice_type == "renewal",
        SubscriptionInvoice.status == "due",
    ).first()
    if open_invoice:
        return

    cycle = subscription.billing_cycle or "monthly"
    plan_id = subscription.pending_plan_id or subscription.plan_id
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    period_start = subscription.renewal_date
    invoice = SubscriptionInvoice(
        org_id=subscription.org_id,
        subscription_id=subscription.id,
        invoice_type="renewal",
        plan_id=plan_id,
        plan_name=plan.name if plan else None,
        billing_cycle=cycle,
        period_start=period_start,
        period_end=period_start + timedelta(days=CYCLE_DAYS.get(cycle, 30)),
        amount=compute_period_amount(db, plan_id, cycle),
        status="due",
        due_date=subscription.renewal_date,
    )
    db.add(invoice)
    db.commit()


def sync_subscription(db: Session, subscription: Subscription | None) -> Subscription | None:
    """Lazy lifecycle engine, run whenever a subscription is read.

    trialing --(trial over)--> expired
    active --(period over)--> past_due --(grace over)--> expired
    Also generates the upcoming renewal invoice inside the notice window.
    """
    if subscription is None:
        return None
    now = datetime.utcnow()

    if subscription.status == "trialing":
        if subscription.trial_ends_at and subscription.trial_ends_at <= now:
            subscription.status = "expired"
            db.commit()
            log_subscription_event(
                db,
                org_id=subscription.org_id,
                subscription_id=subscription.id,
                action="expired",
                old_renewal_date=subscription.trial_ends_at,
                new_renewal_date=subscription.trial_ends_at,
                note="Trial ended",
                actor_id=None,
                actor_name="System",
            )
    elif subscription.status == "active":
        if subscription.renewal_date and subscription.renewal_date <= now:
            subscription.status = "past_due"
            db.commit()
            log_subscription_event(
                db,
                org_id=subscription.org_id,
                subscription_id=subscription.id,
                action="past_due",
                old_renewal_date=subscription.renewal_date,
                new_renewal_date=subscription.renewal_date,
                note=f"Payment due — access continues until {(subscription.renewal_date + timedelta(days=GRACE_DAYS)).date().isoformat()}",
                actor_id=None,
                actor_name="System",
            )

    if subscription.status == "past_due":
        if subscription.renewal_date and subscription.renewal_date + timedelta(days=GRACE_DAYS) <= now:
            subscription.status = "expired"
            db.commit()
            log_subscription_event(
                db,
                org_id=subscription.org_id,
                subscription_id=subscription.id,
                action="expired",
                old_renewal_date=subscription.renewal_date,
                new_renewal_date=subscription.renewal_date,
                note="Grace period ended",
                actor_id=None,
                actor_name="System",
            )

    ensure_renewal_invoice(db, subscription)
    return subscription


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
    """Legacy self-serve activation — disabled.

    Subscriptions are created with the agency (14-day trial) and managed by
    the TripPilot team from the admin panel; payments are collected offline.
    """
    raise HTTPException(
        status_code=403,
        detail="Plans are activated by the TripPilot team. Please contact support to upgrade or renew.",
    )


@router.get("/subscriptions/current", response_model=SubscriptionOut)
def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current organization subscription."""
    subscription = sync_subscription(db, get_org_subscription(db, current_user.org_id))

    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")

    return subscription


class InvoiceOut(BaseModel):
    id: int
    invoice_type: str
    plan_name: str | None
    billing_cycle: str | None
    period_start: str | None
    period_end: str | None
    amount: float
    status: str
    due_date: str | None
    paid_at: str | None
    payment_mode: str | None
    payment_reference: str | None
    note: str | None
    created_at: str | None


def invoice_out(inv: SubscriptionInvoice) -> dict:
    return {
        "id": inv.id,
        "invoice_type": inv.invoice_type,
        "plan_name": inv.plan_name,
        "billing_cycle": inv.billing_cycle,
        "period_start": inv.period_start.isoformat() if inv.period_start else None,
        "period_end": inv.period_end.isoformat() if inv.period_end else None,
        "amount": inv.amount,
        "status": inv.status,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
        "payment_mode": inv.payment_mode,
        "payment_reference": inv.payment_reference,
        "note": inv.note,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }


@router.get("/invoices/current", response_model=List[InvoiceOut])
def get_open_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Open (due) invoices for the user's organization — what needs paying."""
    sync_subscription(db, get_org_subscription(db, current_user.org_id))
    invoices = db.query(SubscriptionInvoice).filter(
        SubscriptionInvoice.org_id == current_user.org_id,
        SubscriptionInvoice.status == "due",
    ).order_by(SubscriptionInvoice.due_date.asc()).all()
    return [invoice_out(i) for i in invoices]


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

    subscription = sync_subscription(db, get_org_subscription(db, org_id))
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

    now = datetime.utcnow()

    # Count actual records — source of truth, always accurate regardless of deletes/imports
    leads_used = db.query(func.count(Lead.id)).filter(Lead.org_id == org_id).scalar() or 0
    itineraries_used = db.query(func.count(Itinerary.id)).filter(Itinerary.org_id == org_id).scalar() or 0
    vouchers_used = db.query(func.count(HotelVoucher.id)).filter(HotelVoucher.org_id == org_id).scalar() or 0
    bills_used = db.query(func.count(Invoice.id)).filter(Invoice.org_id == org_id).scalar() or 0
    team_members_used = db.query(func.count(User.id)).filter(User.org_id == org_id, User.is_active == True).scalar() or 0  # noqa: E712

    days_left_in_trial = None
    if subscription.status == "trialing" and subscription.trial_ends_at:
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
        "subscription_status": subscription.status,
        "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "days_left_in_trial": days_left_in_trial,
    }


class SubscriptionStatusOut(BaseModel):
    is_expired: bool
    days_left_in_trial: int | None
    trial_ends_at: str | None
    status: str
    renewal_date: str | None = None
    grace_ends_at: str | None = None
    due_amount: float | None = None


@router.get("/subscription-status", response_model=SubscriptionStatusOut)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Subscription lifecycle status for banners and access gating."""
    org_id = current_user.org_id

    subscription = sync_subscription(db, get_org_subscription(db, org_id))
    if not subscription:
        return {
            "is_expired": True,
            "days_left_in_trial": None,
            "trial_ends_at": None,
            "status": "no_subscription",
        }

    now = datetime.utcnow()

    days_left_in_trial = None
    if subscription.status == "trialing" and subscription.trial_ends_at:
        days_left_in_trial = max(0, (subscription.trial_ends_at - now).days)

    grace_ends_at = None
    if subscription.status == "past_due" and subscription.renewal_date:
        grace_ends_at = (subscription.renewal_date + timedelta(days=GRACE_DAYS)).isoformat()

    due_invoice = db.query(SubscriptionInvoice).filter(
        SubscriptionInvoice.org_id == org_id,
        SubscriptionInvoice.status == "due",
    ).order_by(SubscriptionInvoice.due_date.asc()).first()

    return {
        "is_expired": subscription.status in ("expired", "cancelled"),
        "days_left_in_trial": days_left_in_trial,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
        "status": subscription.status,
        "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        "grace_ends_at": grace_ends_at,
        "due_amount": due_invoice.amount if due_invoice else None,
    }


def check_write_access(db: Session, org_id: int) -> tuple[bool, str | None]:
    """
    Check if organization has write access. trialing/active/past_due keep
    full access (past_due is the grace window); expired/cancelled are read-only.
    Returns: (has_write_access: bool, expiration_message: str | None)
    """
    subscription = sync_subscription(db, get_org_subscription(db, org_id))

    if not subscription:
        return False, "No active subscription found"

    if subscription.status in WRITE_STATUSES:
        return True, None

    return False, "Your subscription has expired. You can only read existing data. Please contact the TripPilot team to renew."


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

    subscription = get_org_subscription(db, org_id)
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
