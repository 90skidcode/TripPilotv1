import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel, EmailStr
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.lead import Lead, LeadSource, LeadStage
from app.models.customer import Customer
from app.models.b2b_partner import B2BPartner
from app.models.user import User
from app.models.followup import Followup, FollowupStatus

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    customer_id: int
    source: LeadSource = LeadSource.manual
    stage: LeadStage = LeadStage.fresh
    destination: Optional[str] = None
    trip_type: Optional[str] = None
    travel_date: Optional[datetime] = None
    num_adults: Optional[int] = None
    num_children: Optional[int] = None
    num_infants: Optional[int] = None
    budget: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None
    b2b_partner_id: Optional[int] = None


class LeadUpdate(BaseModel):
    customer_id: Optional[int] = None
    source: Optional[LeadSource] = None
    stage: Optional[LeadStage] = None
    destination: Optional[str] = None
    trip_type: Optional[str] = None
    travel_date: Optional[datetime] = None
    num_adults: Optional[int] = None
    num_children: Optional[int] = None
    num_infants: Optional[int] = None
    budget: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None
    b2b_partner_id: Optional[int] = None


class LeadCustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None

    class Config:
        from_attributes = True


class B2BPartnerBrief(BaseModel):
    id: int
    company_name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True


class LeadOut(BaseModel):
    id: int
    customer_id: int
    source: str
    stage: str
    destination: Optional[str]
    trip_type: Optional[str]
    travel_date: Optional[datetime]
    num_adults: Optional[int]
    num_children: Optional[int]
    num_infants: Optional[int]
    adults: Optional[int] = None
    kids: Optional[int] = None
    infants: Optional[int] = None
    budget: Optional[str]
    notes: Optional[str]
    assigned_to: Optional[int]
    b2b_partner_id: Optional[int] = None
    created_at: datetime
    customer: Optional[LeadCustomerOut] = None
    b2b_partner: Optional[B2BPartnerBrief] = None

    class Config:
        from_attributes = True


class AILeadInput(BaseModel):
    text: str


class PaginatedLeads(BaseModel):
    items: List[LeadOut]
    total: int
    page: int
    pages: int
    per_page: int


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedLeads)
def list_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    source: Optional[LeadSource] = None,
    stage: Optional[LeadStage] = None,
    assigned_to: Optional[int] = None,
    unassigned: bool = False,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    q = db.query(Lead).filter(Lead.org_id == current_user.org_id)

    # Agent data scoping: agents see only their own leads
    perms = current_user.group.permissions if current_user.group else {}
    if not current_user.is_superadmin and not perms.get("users", {}).get("read", False):
        q = q.filter(or_(
            Lead.assigned_to == current_user.id,
            Lead.created_by == current_user.id
        ))

    if customer_id:
        q = q.filter(Lead.customer_id == customer_id)
    if search:
        q = q.join(Customer).filter(or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
        ))
    if source:
        q = q.filter(Lead.source == source)
    if stage:
        q = q.filter(Lead.stage == stage)
    if assigned_to:
        q = q.filter(Lead.assigned_to == assigned_to)
    if unassigned:
        q = q.filter(Lead.assigned_to == None)
    if date_from:
        q = q.filter(Lead.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        q = q.filter(Lead.created_at <= datetime.combine(date_to, datetime.max.time()))

    total = q.count()
    leads = q.order_by(Lead.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Add customer and b2b info to leads
    result_items = []
    for lead in leads:
        lead_dict = {
            "id": lead.id,
            "customer_id": lead.customer_id,
            "source": lead.source.value if lead.source else "",
            "stage": lead.stage.value if lead.stage else "",
            "destination": lead.destination,
            "trip_type": lead.trip_type,
            "travel_date": lead.travel_date,
            "num_adults": lead.num_adults,
            "num_children": lead.num_children,
            "num_infants": lead.num_infants,
            "budget": lead.budget,
            "notes": lead.notes,
            "assigned_to": lead.assigned_to,
            "b2b_partner_id": lead.b2b_partner_id,
            "created_at": lead.created_at,
            "customer": {
                "id": lead.customer.id,
                "name": lead.customer.name,
                "phone": lead.customer.phone,
                "email": lead.customer.email,
                "whatsapp_number": lead.customer.whatsapp_number,
            } if lead.customer else None,
            "b2b_partner": {
                "id": lead.b2b_partner.id,
                "company_name": lead.b2b_partner.company_name,
                "category": lead.b2b_partner.category.value if lead.b2b_partner.category else None,
            } if lead.b2b_partner else None,
        }
        result_items.append(lead_dict)

    return PaginatedLeads(
        items=result_items,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    # Verify customer exists and belongs to org
    customer = db.query(Customer).filter(
        Customer.id == payload.customer_id,
        Customer.org_id == current_user.org_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    lead = Lead(**payload.dict(), created_by=current_user.id, org_id=current_user.org_id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/today-reminders")
def get_today_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    today = date.today()
    tomorrow = today + timedelta(days=1)

    leads_with_followups = (
        db.query(Lead)
        .filter(Lead.org_id == current_user.org_id)
        .join(Followup, Lead.id == Followup.lead_id)
        .filter(Followup.created_by == current_user.id)
        .filter(Followup.status == FollowupStatus.pending)
        .filter(Followup.scheduled_date >= datetime(today.year, today.month, today.day, 0, 0, 0))
        .filter(Followup.scheduled_date < datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0))
        .distinct(Lead.id)
        .order_by(Lead.id, Followup.scheduled_date)
        .all()
    )

    return leads_with_followups


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # If customer_id is being updated, verify it exists
    if payload.customer_id:
        customer = db.query(Customer).filter(
            Customer.id == payload.customer_id,
            Customer.org_id == current_user.org_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()


@router.post("/ai", response_model=LeadOut, status_code=201)
async def ai_lead_entry(
    payload: AILeadInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Parse free-text (WhatsApp msg / email) into a structured Lead using Gemini AI."""
    from app.services.ai_service import parse_lead_from_text
    from datetime import datetime as dt

    parsed = await parse_lead_from_text(payload.text)

    # Extract customer info
    customer_name = parsed.get("name") or "Unknown"
    customer_phone = parsed.get("phone") or "0000000000"
    customer_email = parsed.get("email")
    customer_whatsapp = parsed.get("whatsapp_number")

    # Check if customer exists by phone
    customer = db.query(Customer).filter(
        Customer.phone == customer_phone,
        Customer.org_id == current_user.org_id
    ).first()

    # If not found, create new customer
    if not customer:
        customer = Customer(
            org_id=current_user.org_id,
            name=customer_name,
            phone=customer_phone,
            email=customer_email,
            whatsapp_number=customer_whatsapp,
        )
        db.add(customer)
        db.flush()  # Flush to get the customer ID without committing

    # Safely map source string → enum
    source_raw = str(parsed.get("source", "manual")).lower()
    try:
        source = LeadSource(source_raw)
    except ValueError:
        source = LeadSource.manual

    # Parse travel_date if present
    travel_date = None
    if parsed.get("travel_date"):
        try:
            travel_date = dt.strptime(parsed["travel_date"], "%Y-%m-%d")
        except Exception:
            pass

    lead = Lead(
        org_id=current_user.org_id,
        customer_id=customer.id,
        destination=parsed.get("destination") or None,
        trip_type=parsed.get("trip_type") or None,
        num_adults=parsed.get("num_adults") or None,
        num_children=parsed.get("num_children") or None,
        num_infants=parsed.get("num_infants") or None,
        budget=parsed.get("budget") or None,
        travel_date=travel_date,
        notes=parsed.get("notes") or payload.text,
        source=source,
        stage=LeadStage.fresh,
        created_by=current_user.id,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/export/csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    leads = db.query(Lead).filter(Lead.org_id == current_user.org_id).order_by(Lead.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Customer Name", "Phone", "Email", "Source", "Stage", "Destination", "Budget", "Created At"])
    for lead in leads:
        writer.writerow([
            lead.id,
            lead.customer.name if lead.customer else "",
            lead.customer.phone if lead.customer else "",
            lead.customer.email if lead.customer else "",
            lead.source.value if lead.source else "",
            lead.stage.value if lead.stage else "",
            lead.destination or "",
            lead.budget or "",
            lead.created_at.strftime("%Y-%m-%d %H:%M") if lead.created_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@router.post("/import/csv", status_code=201)
def import_leads_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    for row in reader:
        customer_name = row.get("name") or row.get("Lead Name") or row.get("Customer Name") or "Unknown"
        customer_phone = row.get("phone") or row.get("Phone") or "0000000000"
        customer_email = row.get("email") or row.get("Email")

        # Check if customer exists
        customer = db.query(Customer).filter(
            Customer.phone == customer_phone,
            Customer.org_id == current_user.org_id
        ).first()

        # Create customer if not exists
        if not customer:
            customer = Customer(
                org_id=current_user.org_id,
                name=customer_name,
                phone=customer_phone,
                email=customer_email,
            )
            db.add(customer)
            db.flush()

        lead = Lead(
            org_id=current_user.org_id,
            customer_id=customer.id,
            source=LeadSource.manual,
            stage=LeadStage.fresh,
            created_by=current_user.id,
        )
        db.add(lead)
        created += 1
    db.commit()
    return {"created": created, "message": f"Successfully imported {created} leads"}
