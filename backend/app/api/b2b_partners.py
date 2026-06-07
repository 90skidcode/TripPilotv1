from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.b2b_partner import B2BPartner, B2BCategory
from app.models.user import User

router = APIRouter()


class B2BPartnerCreate(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "India"
    category: Optional[B2BCategory] = B2BCategory.dmc
    commission_pct: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class B2BPartnerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    category: Optional[B2BCategory] = None
    commission_pct: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class B2BPartnerOut(BaseModel):
    id: int
    company_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    commission_pct: Optional[float] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedB2BPartners(BaseModel):
    items: List[B2BPartnerOut]
    total: int
    page: int
    pages: int
    per_page: int


@router.get("", response_model=PaginatedB2BPartners)
def list_b2b_partners(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[B2BCategory] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    """List all B2B partners with pagination and search."""
    q = db.query(B2BPartner).filter(B2BPartner.org_id == current_user.org_id)

    if search:
        q = q.filter(or_(
            B2BPartner.company_name.ilike(f"%{search}%"),
            B2BPartner.contact_person.ilike(f"%{search}%"),
            B2BPartner.phone.ilike(f"%{search}%"),
            B2BPartner.email.ilike(f"%{search}%"),
            B2BPartner.city.ilike(f"%{search}%"),
        ))

    if category:
        q = q.filter(B2BPartner.category == category)

    total = q.count()
    partners = q.order_by(B2BPartner.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for p in partners:
        items.append({
            "id": p.id,
            "company_name": p.company_name,
            "contact_person": p.contact_person,
            "phone": p.phone,
            "email": p.email,
            "gst_number": p.gst_number,
            "city": p.city,
            "country": p.country,
            "category": p.category.value if p.category else None,
            "commission_pct": p.commission_pct,
            "notes": p.notes,
            "is_active": p.is_active,
            "created_at": p.created_at,
        })

    return PaginatedB2BPartners(
        items=items,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page or 1,
        per_page=per_page,
    )


@router.post("", response_model=B2BPartnerOut, status_code=201)
def create_b2b_partner(
    payload: B2BPartnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Create a new B2B partner."""
    partner = B2BPartner(
        org_id=current_user.org_id,
        **payload.dict(),
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.get("/{partner_id}", response_model=B2BPartnerOut)
def get_b2b_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    """Get a specific B2B partner."""
    partner = db.query(B2BPartner).filter(
        B2BPartner.id == partner_id,
        B2BPartner.org_id == current_user.org_id,
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="B2B partner not found")
    return partner


@router.put("/{partner_id}", response_model=B2BPartnerOut)
def update_b2b_partner(
    partner_id: int,
    payload: B2BPartnerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Update a B2B partner."""
    partner = db.query(B2BPartner).filter(
        B2BPartner.id == partner_id,
        B2BPartner.org_id == current_user.org_id,
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="B2B partner not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(partner, field, value)

    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{partner_id}", status_code=204)
def delete_b2b_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Delete a B2B partner."""
    partner = db.query(B2BPartner).filter(
        B2BPartner.id == partner_id,
        B2BPartner.org_id == current_user.org_id,
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="B2B partner not found")

    db.delete(partner)
    db.commit()
