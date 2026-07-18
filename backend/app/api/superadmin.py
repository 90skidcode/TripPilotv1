from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta, datetime, date, time
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_db
from app.core.security import require_superadmin, hash_password, create_access_token
from app.core.config import settings
from app.models.user import User
from app.models.organization import Organization
from app.models.lead import Lead
from app.models.pricing_plan import PricingPlan, Subscription, PlanBillingCycle
from app.models.subscription_history import SubscriptionHistory
from app.services.subscription_history import log_subscription_event
from app.api.pricing import CYCLE_DAYS, calculate_renewal_date

router = APIRouter()


class AgencyCreate(BaseModel):
    name: str
    slug: str
    phone_number: str | None = None
    logo_url: str | None = None
    user_name: str
    user_phone: str | None = None
    user_email: str
    user_password: str
    plan_id: int  # PricingPlan.id
    billing_cycle: str | None = None  # monthly, quarterly, half_yearly, yearly
    plan_billing_cycle_id: int | None = None


class AgencyUpdate(BaseModel):
    name: str | None = None
    phone_number: str | None = None
    logo_url: str | None = None
    plan_id: int | None = None


class AgencyOut(BaseModel):
    id: int
    name: str
    slug: str
    plan: str
    plan_id: int
    phone_number: str | None = None
    logo_url: str | None = None
    is_active: bool
    created_at: str | None
    user_count: int = 0
    lead_count: int = 0
    subscription_status: str
    renewal_date: str | None = None
    trial_ends_at: str | None = None

    class Config:
        from_attributes = True


class AgencyUserOut(BaseModel):
    id: int
    name: str
    email: str
    org_id: int
    group_id: int | None = None

    class Config:
        from_attributes = True


class ImpersonateResponse(BaseModel):
    token: str
    token_type: str
    user_id: int
    org_id: int


@router.get("/agencies", response_model=list[AgencyOut])
def list_agencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List all organizations with stats."""
    orgs = db.query(Organization).all()
    result = []

    for org in orgs:
        user_count = db.query(func.count(User.id)).filter(User.org_id == org.id).scalar()
        lead_count = db.query(func.count(Lead.id)).filter(Lead.org_id == org.id).scalar()

        # Get subscription info
        subscription = db.query(Subscription).filter(Subscription.org_id == org.id).first()

        result.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "plan": org.plan,
            "plan_id": subscription.plan_id if subscription else 1,  # Default to Free Trial plan
            "phone_number": org.phone_number,
            "logo_url": org.logo_url,
            "is_active": org.is_active,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "user_count": user_count,
            "lead_count": lead_count,
            "subscription_status": subscription.status if subscription else "no_subscription",
            "renewal_date": subscription.renewal_date.isoformat() if subscription and subscription.renewal_date else None,
            "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription and subscription.trial_ends_at else None,
        })

    return result


@router.post("/agencies", response_model=AgencyOut, status_code=201)
def create_agency(
    payload: AgencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create new agency organization with first admin user and subscription."""
    # Check if slug already exists
    existing = db.query(Organization).filter(Organization.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )

    # Verify plan exists
    plan = db.query(PricingPlan).filter(PricingPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing plan not found"
        )

    # Check if user email already exists
    existing_user = db.query(User).filter(User.email == payload.user_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered to another user"
        )

    # Create organization
    org = Organization(
        name=payload.name,
        slug=payload.slug,
        plan=plan.name,  # Store plan name for reference
        phone_number=payload.phone_number,
        logo_url=payload.logo_url,
        is_active=True,
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # Create subscription
    subscription = Subscription(
        org_id=org.id,
        plan_id=payload.plan_id,
        plan_billing_cycle_id=payload.plan_billing_cycle_id,
        billing_cycle=payload.billing_cycle,
        status="active",
        start_date=datetime.utcnow(),
    )

    # Set trial end date if it's a trial plan
    if plan.trial_days > 0:
        subscription.trial_ends_at = datetime.utcnow() + timedelta(days=plan.trial_days)
    else:
        subscription.renewal_date = calculate_renewal_date(payload.billing_cycle or "monthly")

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    log_subscription_event(
        db,
        org_id=org.id,
        subscription_id=subscription.id,
        action="created",
        new_plan_id=plan.id,
        plan_name=plan.name,
        billing_cycle=subscription.billing_cycle,
        new_renewal_date=subscription.renewal_date or subscription.trial_ends_at,
        actor_id=current_user.id,
        actor_name=current_user.name,
    )

    # Create default "Admin" group with full permissions
    from app.models.user_group import UserGroup
    admin_group = UserGroup(
        org_id=org.id,
        name="Admin Group",
        permissions={
            "leads": {"read": True, "write": True},
            "itinerary": {"read": True, "write": True},
            "vouchers": {"read": True, "write": True},
            "inventory": {"read": True, "write": True},
            "dashboard": {"read": True, "write": True},
            "settings": {"read": True, "write": True},
            "users": {"read": True, "write": True},
        }
    )
    db.add(admin_group)
    db.commit()
    db.refresh(admin_group)

    # Create first admin user for this org with group assignment
    admin = User(
        name=payload.user_name,
        email=payload.user_email,
        phone_number=payload.user_phone,
        hashed_password=hash_password(payload.user_password),
        role="admin",  # Set admin role for full access
        org_id=org.id,
        is_superadmin=False,
        group_id=admin_group.id,  # Assign to default admin group
    )
    db.add(admin)
    db.commit()

    user_count = db.query(func.count(User.id)).filter(User.org_id == org.id).scalar()
    lead_count = db.query(func.count(Lead.id)).filter(Lead.org_id == org.id).scalar()

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "plan": org.plan,
        "plan_id": payload.plan_id,
        "phone_number": org.phone_number,
        "logo_url": org.logo_url,
        "is_active": org.is_active,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "user_count": user_count,
        "lead_count": lead_count,
        "subscription_status": subscription.status,
        "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
    }


@router.get("/agencies/{agency_id}", response_model=AgencyOut)
def get_agency(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get agency details with stats."""
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Get subscription
    subscription = db.query(Subscription).filter(
        Subscription.org_id == org.id,
        Subscription.status == "active"
    ).first()

    user_count = db.query(func.count(User.id)).filter(User.org_id == org.id).scalar()
    lead_count = db.query(func.count(Lead.id)).filter(Lead.org_id == org.id).scalar()

    plan_id = subscription.plan_id if subscription else 1
    sub_status = subscription.status if subscription else "no_subscription"
    renewal_date = subscription.renewal_date.isoformat() if subscription and subscription.renewal_date else None
    trial_ends = subscription.trial_ends_at.isoformat() if subscription and subscription.trial_ends_at else None

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "plan": org.plan,
        "plan_id": plan_id,
        "phone_number": org.phone_number,
        "logo_url": org.logo_url,
        "is_active": org.is_active,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "user_count": user_count,
        "lead_count": lead_count,
        "subscription_status": sub_status,
        "renewal_date": renewal_date,
        "trial_ends_at": trial_ends,
    }


@router.put("/agencies/{agency_id}", response_model=AgencyOut)
def update_agency(
    agency_id: int,
    payload: AgencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update agency organization."""
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    if payload.name is not None:
        org.name = payload.name
    if payload.phone_number is not None:
        org.phone_number = payload.phone_number
    if payload.logo_url is not None:
        org.logo_url = payload.logo_url

    plan_change_event = None
    if payload.plan_id is not None:
        plan = db.query(PricingPlan).filter(PricingPlan.id == payload.plan_id).first()
        if plan:
            org.plan = plan.name
            # Update latest subscription if exists, or create a new one
            subscription = db.query(Subscription).filter(
                Subscription.org_id == org.id
            ).order_by(Subscription.id.desc()).first()
            old_plan_id = subscription.plan_id if subscription else None
            old_renewal = (subscription.renewal_date or subscription.trial_ends_at) if subscription else None
            if subscription:
                subscription.plan_id = payload.plan_id
                # Update trial/renewal dates based on plan type
                if plan.trial_days > 0:
                    subscription.trial_ends_at = datetime.utcnow() + timedelta(days=plan.trial_days)
                    subscription.renewal_date = None
                else:
                    subscription.renewal_date = calculate_renewal_date(subscription.billing_cycle or "monthly")
                    subscription.trial_ends_at = None
            else:
                subscription = Subscription(
                    org_id=org.id,
                    plan_id=payload.plan_id,
                    status="active",
                    start_date=datetime.utcnow()
                )
                # Set trial end date if it's a trial plan
                if plan.trial_days > 0:
                    subscription.trial_ends_at = datetime.utcnow() + timedelta(days=plan.trial_days)
                else:
                    subscription.renewal_date = calculate_renewal_date("monthly")
                db.add(subscription)

            if old_plan_id != payload.plan_id:
                plan_change_event = {
                    "old_plan_id": old_plan_id,
                    "new_plan_id": plan.id,
                    "plan_name": plan.name,
                    "old_renewal_date": old_renewal,
                }

    db.commit()
    db.refresh(org)

    if plan_change_event:
        subscription = db.query(Subscription).filter(
            Subscription.org_id == org.id
        ).order_by(Subscription.id.desc()).first()
        log_subscription_event(
            db,
            org_id=org.id,
            subscription_id=subscription.id if subscription else None,
            action="plan_changed",
            old_plan_id=plan_change_event["old_plan_id"],
            new_plan_id=plan_change_event["new_plan_id"],
            plan_name=plan_change_event["plan_name"],
            billing_cycle=subscription.billing_cycle if subscription else None,
            old_renewal_date=plan_change_event["old_renewal_date"],
            new_renewal_date=(subscription.renewal_date or subscription.trial_ends_at) if subscription else None,
            actor_id=current_user.id,
            actor_name=current_user.name,
        )

    user_count = db.query(func.count(User.id)).filter(User.org_id == org.id).scalar()
    lead_count = db.query(func.count(Lead.id)).filter(Lead.org_id == org.id).scalar()

    # Get subscription for response
    subscription = db.query(Subscription).filter(Subscription.org_id == org.id).first()
    plan_id = subscription.plan_id if subscription else 1
    sub_status = subscription.status if subscription else "no_subscription"
    renewal_date = subscription.renewal_date.isoformat() if subscription and subscription.renewal_date else None
    trial_ends = subscription.trial_ends_at.isoformat() if subscription and subscription.trial_ends_at else None

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "plan": org.plan,
        "plan_id": plan_id,
        "phone_number": org.phone_number,
        "logo_url": org.logo_url,
        "is_active": org.is_active,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "user_count": user_count,
        "lead_count": lead_count,
        "subscription_status": sub_status,
        "renewal_date": renewal_date,
        "trial_ends_at": trial_ends,
    }


@router.post("/agencies/{agency_id}/suspend")
def toggle_agency_active(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Toggle agency active/inactive status."""
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    org.is_active = not org.is_active
    db.commit()

    return {
        "id": org.id,
        "name": org.name,
        "is_active": org.is_active,
        "status": "activated" if org.is_active else "suspended"
    }


@router.get("/agencies/{agency_id}/users", response_model=list[AgencyUserOut])
def list_agency_users(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List all users in an agency organization."""
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    users = db.query(User).filter(User.org_id == agency_id).all()
    return users


@router.post("/impersonate/{user_id}", response_model=ImpersonateResponse)
def impersonate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Generate a JWT token for impersonating a user (1-hour expiry)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create token with 1-hour expiry for impersonation
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=1)
    )

    return {
        "token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "org_id": user.org_id,
    }


@router.get("/health")
def health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get system health and stats."""
    total_orgs = db.query(func.count(Organization.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_leads = db.query(func.count(Lead.id)).scalar()
    active_orgs = db.query(func.count(Organization.id)).filter(Organization.is_active == True).scalar()

    return {
        "status": "healthy",
        "organizations": {
            "total": total_orgs,
            "active": active_orgs,
        },
        "users": {
            "total": total_users,
        },
        "leads": {
            "total": total_leads,
        }
    }


# ── Granular User Groups & Permission Matrix Endpoints for Super Admin ──
from app.models.user_group import UserGroup

class PermissionMatrix(BaseModel):
    leads: dict = {"read": False, "write": False}
    itinerary: dict = {"read": False, "write": False}
    vouchers: dict = {"read": False, "write": False}
    inventory: dict = {"read": False, "write": False}
    dashboard: dict = {"read": False, "write": False}
    settings: dict = {"read": False, "write": False}
    users: dict = {"read": False, "write": False}

class UserGroupCreate(BaseModel):
    name: str
    permissions: PermissionMatrix

class UserGroupUpdate(BaseModel):
    name: str | None = None
    permissions: PermissionMatrix | None = None

class UserGroupOut(BaseModel):
    id: int
    org_id: int
    name: str
    permissions: dict

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    group_id: int | None = None


@router.get("/agencies/{agency_id}/user-groups", response_model=list[UserGroupOut])
def list_agency_user_groups(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List all user groups in a specific organization."""
    return db.query(UserGroup).filter(UserGroup.org_id == agency_id).all()


@router.post("/agencies/{agency_id}/user-groups", response_model=UserGroupOut, status_code=201)
def create_agency_user_group(
    agency_id: int,
    payload: UserGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create a new user group with permissions matrix in a specific agency."""
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    group = UserGroup(
        org_id=agency_id,
        name=payload.name,
        permissions=payload.permissions.dict(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/agencies/{agency_id}/user-groups/{group_id}", response_model=UserGroupOut)
def update_agency_user_group(
    agency_id: int,
    group_id: int,
    payload: UserGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update a specific user group in an agency."""
    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == agency_id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="User group not found in this agency")

    if payload.name is not None:
        group.name = payload.name
    if payload.permissions is not None:
        group.permissions = payload.permissions.dict()

    db.commit()
    db.refresh(group)
    return group


@router.delete("/agencies/{agency_id}/user-groups/{group_id}", status_code=204)
def delete_agency_user_group(
    agency_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Delete a user group in an agency. Users in this group must be reassigned first."""
    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == agency_id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="User group not found in this agency")

    # Check if any users are in this group
    users_in_group = db.query(func.count(User.id)).filter(User.group_id == group_id).scalar()
    if users_in_group > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete group with {users_in_group} assigned user(s). Reassign them to another group first."
        )

    db.delete(group)
    db.commit()
    return None


@router.put("/users/{user_id}", response_model=AgencyUserOut)
def update_agency_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update user profile role and group assignments."""
    user = db.query(User).filter(User.id == user_id, User.is_superadmin == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        # Check uniqueness
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email address is already in use by another user")
        user.email = payload.email
    if payload.group_id is not None:
        # Verify group exists in organization
        group = db.query(UserGroup).filter(
            UserGroup.id == payload.group_id,
            UserGroup.org_id == user.org_id
        ).first()
        if not group:
            raise HTTPException(status_code=404, detail="User Group not found in this organization")
        user.group_id = payload.group_id

    db.commit()
    db.refresh(user)
    return user


# ── Subscription management (manual renewals — no auto-pay) ──────────────────

class SubscriptionExtendPayload(BaseModel):
    mode: Literal["billing_cycle", "months", "exact_date"] = "billing_cycle"
    months: int | None = Field(default=None, ge=1, le=60)
    new_renewal_date: date | None = None
    plan_id: int | None = None
    plan_billing_cycle_id: int | None = None
    billing_cycle: str | None = None
    amount: float | None = Field(default=None, ge=0)
    payment_mode: Literal["upi", "bank_transfer", "cash", "cheque", "other"] | None = None
    payment_reference: str | None = Field(default=None, max_length=100)
    note: str | None = None


class SubscriptionDetailOut(BaseModel):
    subscription_id: int
    org_id: int
    org_name: str
    plan_id: int
    plan_name: str
    billing_cycle: str | None
    status: str
    start_date: str | None
    renewal_date: str | None
    trial_ends_at: str | None


class SubscriptionListItemOut(SubscriptionDetailOut):
    subscription_id: int | None = None
    plan_id: int | None = None
    plan_name: str | None = None
    effective_status: str
    days_left: int | None = None
    last_extended_at: str | None = None


class SubscriptionHistoryOut(BaseModel):
    id: int
    org_id: int
    subscription_id: int | None
    action: str
    old_plan_id: int | None
    new_plan_id: int | None
    plan_name: str | None
    billing_cycle: str | None
    old_renewal_date: str | None
    new_renewal_date: str | None
    amount: float | None
    payment_mode: str | None
    payment_reference: str | None
    note: str | None
    actor_id: int | None
    actor_name: str | None
    created_at: str | None


def _latest_subscription(db: Session, org_id: int) -> Subscription | None:
    return db.query(Subscription).filter(
        Subscription.org_id == org_id
    ).order_by(Subscription.id.desc()).first()


def _history_out(event: SubscriptionHistory) -> dict:
    return {
        "id": event.id,
        "org_id": event.org_id,
        "subscription_id": event.subscription_id,
        "action": event.action,
        "old_plan_id": event.old_plan_id,
        "new_plan_id": event.new_plan_id,
        "plan_name": event.plan_name,
        "billing_cycle": event.billing_cycle,
        "old_renewal_date": event.old_renewal_date.isoformat() if event.old_renewal_date else None,
        "new_renewal_date": event.new_renewal_date.isoformat() if event.new_renewal_date else None,
        "amount": event.amount,
        "payment_mode": event.payment_mode,
        "payment_reference": event.payment_reference,
        "note": event.note,
        "actor_id": event.actor_id,
        "actor_name": event.actor_name,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


@router.post("/agencies/{agency_id}/subscription/extend", response_model=SubscriptionDetailOut)
def extend_subscription(
    agency_id: int,
    payload: SubscriptionExtendPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Manually extend (renew) an agency's subscription after offline payment.

    Extends from the current expiry date (or today if already expired),
    reactivates expired subscriptions, and converts trials to paid.
    """
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    subscription = _latest_subscription(db, agency_id)

    plan_id = payload.plan_id or (subscription.plan_id if subscription else None)
    if not plan_id:
        raise HTTPException(status_code=400, detail="No subscription exists for this agency — plan_id is required")
    plan = db.query(PricingPlan).filter(PricingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if payload.plan_billing_cycle_id is not None:
        cycle_row = db.query(PlanBillingCycle).filter(
            PlanBillingCycle.id == payload.plan_billing_cycle_id,
            PlanBillingCycle.plan_id == plan.id,
        ).first()
        if not cycle_row:
            raise HTTPException(status_code=404, detail="Billing cycle not found for this plan")

    effective_cycle = payload.billing_cycle or (subscription.billing_cycle if subscription else None) or "monthly"
    if effective_cycle not in CYCLE_DAYS:
        raise HTTPException(status_code=400, detail=f"Invalid billing cycle: {effective_cycle}")

    now = datetime.utcnow()
    old_plan_id = subscription.plan_id if subscription else None
    old_renewal = (subscription.renewal_date or subscription.trial_ends_at) if subscription else None
    base = max(old_renewal, now) if old_renewal else now

    if payload.mode == "billing_cycle":
        new_renewal = base + timedelta(days=CYCLE_DAYS[effective_cycle])
    elif payload.mode == "months":
        if not payload.months:
            raise HTTPException(status_code=400, detail="months is required for months mode")
        new_renewal = base + timedelta(days=30 * payload.months)
    else:  # exact_date
        if not payload.new_renewal_date:
            raise HTTPException(status_code=400, detail="new_renewal_date is required for exact_date mode")
        new_renewal = datetime.combine(payload.new_renewal_date, time(23, 59, 59))
        if new_renewal <= now:
            raise HTTPException(status_code=400, detail="new_renewal_date must be in the future")

    if subscription:
        subscription.plan_id = plan.id
        if payload.plan_billing_cycle_id is not None:
            subscription.plan_billing_cycle_id = payload.plan_billing_cycle_id
        subscription.billing_cycle = effective_cycle
        subscription.renewal_date = new_renewal
        subscription.trial_ends_at = None  # extension always converts to a renewal-date-driven sub
        subscription.status = "active"
        subscription.updated_at = now
    else:
        subscription = Subscription(
            org_id=agency_id,
            plan_id=plan.id,
            plan_billing_cycle_id=payload.plan_billing_cycle_id,
            billing_cycle=effective_cycle,
            status="active",
            start_date=now,
            renewal_date=new_renewal,
        )
        db.add(subscription)

    org.plan = plan.name  # keep denormalized plan name in sync
    db.commit()
    db.refresh(subscription)

    log_subscription_event(
        db,
        org_id=agency_id,
        subscription_id=subscription.id,
        action="plan_changed" if (old_plan_id is not None and old_plan_id != plan.id) else "extended",
        old_plan_id=old_plan_id,
        new_plan_id=plan.id,
        plan_name=plan.name,
        billing_cycle=effective_cycle,
        old_renewal_date=old_renewal,
        new_renewal_date=new_renewal,
        amount=payload.amount,
        payment_mode=payload.payment_mode,
        payment_reference=payload.payment_reference,
        note=payload.note,
        actor_id=current_user.id,
        actor_name=current_user.name,
    )

    return {
        "subscription_id": subscription.id,
        "org_id": agency_id,
        "org_name": org.name,
        "plan_id": plan.id,
        "plan_name": plan.name,
        "billing_cycle": subscription.billing_cycle,
        "status": subscription.status,
        "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
        "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
        "trial_ends_at": None,
    }


@router.get("/subscriptions", response_model=list[SubscriptionListItemOut])
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List every organization's latest subscription with derived status."""
    now = datetime.utcnow()
    result = []

    for org in db.query(Organization).all():
        subscription = _latest_subscription(db, org.id)
        if not subscription:
            result.append({
                "subscription_id": None,
                "org_id": org.id,
                "org_name": org.name,
                "plan_id": None,
                "plan_name": org.plan,
                "billing_cycle": None,
                "status": "no_subscription",
                "effective_status": "no_subscription",
                "start_date": None,
                "renewal_date": None,
                "trial_ends_at": None,
                "days_left": None,
                "last_extended_at": None,
            })
            continue

        plan = db.query(PricingPlan).filter(PricingPlan.id == subscription.plan_id).first()
        expiry = subscription.renewal_date or subscription.trial_ends_at

        if expiry and expiry <= now:
            effective_status = "expired"
        elif subscription.trial_ends_at and subscription.trial_ends_at > now:
            effective_status = "trial"
        else:
            effective_status = subscription.status

        days_left = max(0, (expiry - now).days) if expiry else None

        last_extended = db.query(SubscriptionHistory).filter(
            SubscriptionHistory.org_id == org.id,
            SubscriptionHistory.action.in_(["extended", "plan_changed"]),
        ).order_by(SubscriptionHistory.created_at.desc(), SubscriptionHistory.id.desc()).first()

        result.append({
            "subscription_id": subscription.id,
            "org_id": org.id,
            "org_name": org.name,
            "plan_id": subscription.plan_id,
            "plan_name": plan.name if plan else org.plan,
            "billing_cycle": subscription.billing_cycle,
            "status": subscription.status,
            "effective_status": effective_status,
            "start_date": subscription.start_date.isoformat() if subscription.start_date else None,
            "renewal_date": subscription.renewal_date.isoformat() if subscription.renewal_date else None,
            "trial_ends_at": subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
            "days_left": days_left,
            "last_extended_at": last_extended.created_at.isoformat() if last_extended and last_extended.created_at else None,
        })

    return result


@router.get("/agencies/{agency_id}/subscription/history", response_model=list[SubscriptionHistoryOut])
def get_subscription_history(
    agency_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Timeline of subscription events for an agency, newest first."""
    org = db.query(Organization).filter(Organization.id == agency_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    events = db.query(SubscriptionHistory).filter(
        SubscriptionHistory.org_id == agency_id
    ).order_by(
        SubscriptionHistory.created_at.desc(), SubscriptionHistory.id.desc()
    ).offset(offset).limit(limit).all()

    return [_history_out(e) for e in events]

