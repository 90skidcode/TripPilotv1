from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.user import User

router = APIRouter()


class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    lead_count: int = 0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedCustomers(BaseModel):
    items: List[CustomerOut]
    total: int
    page: int
    pages: int
    per_page: int


@router.get("")
def list_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    """List all customers in current organization with pagination and lead count."""
    lead_count_sub = (
        db.query(Lead.customer_id, func.count(Lead.id).label("lead_count"))
        .filter(Lead.org_id == current_user.org_id)
        .group_by(Lead.customer_id)
        .subquery()
    )

    q = db.query(Customer, func.coalesce(lead_count_sub.c.lead_count, 0).label("lead_count")).outerjoin(
        lead_count_sub, Customer.id == lead_count_sub.c.customer_id
    ).filter(Customer.org_id == current_user.org_id)

    if search:
        q = q.filter(or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
        ))

    total = q.count()
    rows = q.order_by(Customer.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for customer, lead_count in rows:
        items.append({
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "whatsapp_number": customer.whatsapp_number,
            "lead_count": lead_count,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
        })

    return PaginatedCustomers(
        items=items,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page or 1,
        per_page=per_page,
    )


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Create a new customer."""
    # Check if customer with same phone already exists
    existing = db.query(Customer).filter(
        Customer.phone == payload.phone,
        Customer.org_id == current_user.org_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this phone number already exists")

    # Check if email is provided and already exists (only for non-null emails)
    if payload.email:
        existing_email = db.query(Customer).filter(
            Customer.email == payload.email,
            Customer.org_id == current_user.org_id
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")

    customer = Customer(
        org_id=current_user.org_id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        whatsapp_number=payload.whatsapp_number,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "whatsapp_number": customer.whatsapp_number,
        "lead_count": 0,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific customer."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == current_user.org_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    lead_count = db.query(func.count(Lead.id)).filter(Lead.customer_id == customer.id).scalar() or 0

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "whatsapp_number": customer.whatsapp_number,
        "lead_count": lead_count,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


@router.get("/{customer_id}/workspace")
def customer_workspace(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    """Aggregate all entities (itineraries, vouchers, flights, invoices, activities)
    across all leads of a customer."""
    from app.models.itinerary import Itinerary
    from app.models.tools import HotelVoucher, Invoice, FlightTicket
    from app.models.lead_partner import LeadPartner
    from app.models.activity import LeadActivity

    customer = db.query(Customer).filter(
        Customer.id == customer_id, Customer.org_id == current_user.org_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    org_id = current_user.org_id
    lead_ids = db.query(Lead.id).filter(Lead.customer_id == customer_id).all()
    lead_ids = [row[0] for row in lead_ids]

    if not lead_ids:
        return {
            "counts": {
                "leads": 0,
                "itineraries": 0,
                "vouchers": 0,
                "flights": 0,
                "invoices": 0,
                "partners": 0,
                "activities": 0,
            },
            "itineraries": [],
            "vouchers": [],
            "flights": [],
            "invoices": [],
            "partners": [],
            "activities": [],
        }

    # Aggregate all entities from all leads
    itineraries = db.query(Itinerary).filter(
        Itinerary.org_id == org_id, Itinerary.lead_id.in_(lead_ids)
    ).order_by(Itinerary.created_at.desc()).all()

    vouchers = db.query(HotelVoucher).filter(
        HotelVoucher.org_id == org_id, HotelVoucher.lead_id.in_(lead_ids)
    ).order_by(HotelVoucher.created_at.desc()).all()

    flights = db.query(FlightTicket).filter(
        FlightTicket.org_id == org_id, FlightTicket.lead_id.in_(lead_ids)
    ).order_by(FlightTicket.created_at.desc()).all()

    invoices = db.query(Invoice).filter(
        Invoice.org_id == org_id, Invoice.lead_id.in_(lead_ids)
    ).order_by(Invoice.created_at.desc()).all()

    partners = db.query(LeadPartner).filter(
        LeadPartner.org_id == org_id, LeadPartner.lead_id.in_(lead_ids)
    ).order_by(LeadPartner.created_at.desc()).all()

    activities = db.query(LeadActivity).filter(
        LeadActivity.org_id == org_id, LeadActivity.lead_id.in_(lead_ids)
    ).order_by(LeadActivity.created_at.desc()).all()

    return {
        "counts": {
            "leads": len(lead_ids),
            "itineraries": len(itineraries),
            "vouchers": len(vouchers),
            "flights": len(flights),
            "invoices": len(invoices),
            "partners": len(partners),
            "activities": len(activities),
        },
        "itineraries": [
            {
                "id": i.id,
                "title": i.title,
                "destination": i.destination,
                "total_days": i.total_days,
                "lead_id": i.lead_id,
                "created_at": i.created_at,
            }
            for i in itineraries
        ],
        "vouchers": [
            {
                "id": v.id,
                "hotel_name": v.hotel_name,
                "room_type": v.room_type,
                "check_in": v.check_in,
                "lead_id": v.lead_id,
                "created_at": v.created_at,
            }
            for v in vouchers
        ],
        "flights": [
            {
                "id": f.id,
                "airline": f.airline,
                "flight_number": f.flight_number,
                "origin": f.origin,
                "destination": f.destination,
                "depart_at": f.depart_at,
                "lead_id": f.lead_id,
                "created_at": f.created_at,
            }
            for f in flights
        ],
        "invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "grand_total": inv.grand_total,
                "status": inv.status,
                "lead_id": inv.lead_id,
                "created_at": inv.created_at,
            }
            for inv in invoices
        ],
        "partners": [
            {
                "id": p.id,
                "b2b_partner_id": p.b2b_partner_id,
                "company_name": p.partner.company_name if p.partner else None,
                "category": (p.partner.category.value if p.partner and hasattr(p.partner.category, "value") else (p.partner.category if p.partner else None)),
                "role": p.role,
                "cost": p.cost,
                "lead_id": p.lead_id,
                "created_at": p.created_at,
            }
            for p in partners
        ],
        "activities": [
            {
                "id": a.id,
                "type": a.type,
                "title": a.title,
                "description": a.description,
                "lead_id": a.lead_id,
                "actor_name": a.actor.name if a.actor else None,
                "created_at": a.created_at,
            }
            for a in activities
        ],
    }


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Update a customer."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == current_user.org_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    lead_count = db.query(func.count(Lead.id)).filter(Lead.customer_id == customer.id).scalar() or 0

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "whatsapp_number": customer.whatsapp_number,
        "lead_count": lead_count,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Delete a customer."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == current_user.org_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
