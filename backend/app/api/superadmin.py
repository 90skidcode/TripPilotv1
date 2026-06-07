from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import require_superadmin, hash_password, create_access_token
from app.core.config import settings
from app.models.user import User
from app.models.organization import Organization
from app.models.lead import Lead
from app.models.pricing_plan import PricingPlan, Subscription

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
    role: str
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
        status="active",
        start_date=datetime.utcnow(),
    )

    # Set trial end date if it's a trial plan
    if plan.trial_days > 0:
        subscription.trial_ends_at = datetime.utcnow() + timedelta(days=plan.trial_days)
    else:
        # Set renewal date for paid plans (1 month from now)
        subscription.renewal_date = datetime.utcnow() + timedelta(days=30)

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    # Create first admin user for this org
    admin = User(
        name=payload.user_name,
        email=payload.user_email,
        phone_number=payload.user_phone,
        hashed_password=hash_password(payload.user_password),
        org_id=org.id,
        role="admin",
        is_superadmin=False,
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
    sub_status = subscription.status if subscription else None
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

    if payload.plan_id is not None:
        plan = db.query(PricingPlan).filter(PricingPlan.id == payload.plan_id).first()
        if plan:
            org.plan = plan.name
            # Update subscription if exists, or create a new one
            subscription = db.query(Subscription).filter(Subscription.org_id == org.id).first()
            if subscription:
                subscription.plan_id = payload.plan_id
            else:
                subscription = Subscription(
                    org_id=org.id,
                    plan_id=payload.plan_id,
                    status="active",
                    start_date=datetime.utcnow()
                )
                db.add(subscription)

    db.commit()
    db.refresh(org)

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
    role: str | None = None
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
    """Delete a user group in an agency."""
    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == agency_id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="User group not found in this agency")

    # Clear association from users
    db.query(User).filter(User.group_id == group_id).update({User.group_id: None})
    
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
    if payload.role is not None:
        user.role = payload.role
    if payload.group_id is not None:
        if payload.group_id == -1: # indicator to clear group assignment
            user.group_id = None
        else:
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

