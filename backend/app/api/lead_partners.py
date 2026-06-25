from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_permission
from app.models.lead import Lead
from app.models.b2b_partner import B2BPartner
from app.models.lead_partner import LeadPartner
from app.models.user import User
from app.services.activity import log_activity

router = APIRouter()

LEAD_NOT_FOUND = "Lead not found"
LINK_NOT_FOUND = "Partner link not found"


class PartnerLinkCreate(BaseModel):
    b2b_partner_id: int
    role: Optional[str] = None
    country: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None


class PartnerLinkUpdate(BaseModel):
    role: Optional[str] = None
    country: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None


class PartnerLinkOut(BaseModel):
    id: int
    b2b_partner_id: int
    company_name: Optional[str] = None
    category: Optional[str] = None
    role: Optional[str] = None
    country: Optional[str] = None
    countries: Optional[List[str]] = []
    cost: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


def _get_lead(db: Session, lead_id: int, current_user: User) -> Lead:
    lead = db.query(Lead).filter(
        Lead.id == lead_id, Lead.org_id == current_user.org_id
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail=LEAD_NOT_FOUND)
    return lead


def _serialize(link: LeadPartner) -> dict:
    partner = link.partner
    category = partner.category if partner else None
    return {
        "id": link.id,
        "b2b_partner_id": link.b2b_partner_id,
        "company_name": partner.company_name if partner else None,
        "category": category.value if hasattr(category, "value") else category,
        "role": link.role,
        "country": link.country,
        "countries": partner.countries or [] if partner else [],
        "cost": link.cost,
        "notes": link.notes,
        "created_at": link.created_at,
    }


@router.get("/{lead_id}/partners", response_model=List[PartnerLinkOut])
def list_lead_partners(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    _get_lead(db, lead_id, current_user)
    links = db.query(LeadPartner).filter(
        LeadPartner.org_id == current_user.org_id,
        LeadPartner.lead_id == lead_id,
    ).order_by(LeadPartner.created_at.desc()).all()
    return [_serialize(link) for link in links]


@router.post("/{lead_id}/partners", response_model=PartnerLinkOut, status_code=201)
def connect_lead_partner(
    lead_id: int,
    payload: PartnerLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    lead = _get_lead(db, lead_id, current_user)

    partner = db.query(B2BPartner).filter(
        B2BPartner.id == payload.b2b_partner_id,
        B2BPartner.org_id == current_user.org_id,
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="B2B partner not found")

    link = LeadPartner(
        org_id=current_user.org_id,
        lead_id=lead_id,
        b2b_partner_id=payload.b2b_partner_id,
        role=payload.role,
        country=payload.country,
        cost=payload.cost,
        notes=payload.notes,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    log_activity(
        db, org_id=current_user.org_id, lead_id=lead_id, customer_id=lead.customer_id,
        actor_id=current_user.id, type="partner_linked",
        title=f"Connected B2B partner: {partner.company_name}",
        description=link.role or None, ref_type="partner", ref_id=link.id,
    )
    return _serialize(link)


@router.put("/{lead_id}/partners/{link_id}", response_model=PartnerLinkOut)
def update_lead_partner(
    lead_id: int,
    link_id: int,
    payload: PartnerLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    _get_lead(db, lead_id, current_user)
    link = db.query(LeadPartner).filter(
        LeadPartner.id == link_id,
        LeadPartner.lead_id == lead_id,
        LeadPartner.org_id == current_user.org_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail=LINK_NOT_FOUND)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(link, field, value)
    db.commit()
    db.refresh(link)
    return _serialize(link)


@router.delete("/{lead_id}/partners/{link_id}", status_code=204)
def disconnect_lead_partner(
    lead_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    _get_lead(db, lead_id, current_user)
    link = db.query(LeadPartner).filter(
        LeadPartner.id == link_id,
        LeadPartner.lead_id == lead_id,
        LeadPartner.org_id == current_user.org_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail=LINK_NOT_FOUND)
    db.delete(link)
    db.commit()
