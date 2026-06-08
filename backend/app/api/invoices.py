from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tools import Invoice
from app.models.user import User
from app.services.activity import log_activity

router = APIRouter()


class InvoiceCreate(BaseModel):
    lead_id: Optional[int] = None
    agency_name: Optional[str] = None
    agency_address: Optional[str] = None
    agency_gst: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gst: Optional[str] = None
    booking_type: Optional[str] = None
    line_items: Optional[Any] = None
    subtotal: Optional[str] = None
    advance_payment: Optional[str] = None
    total_gst: Optional[str] = None
    grand_total: Optional[str] = None
    tax_basis: str = "on_selling_price"
    payment_terms: Optional[str] = None
    bank_holder: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    status: str = "draft"


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    lead_id: Optional[int]
    customer_name: Optional[str]
    grand_total: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


def _next_invoice_number(db: Session, org_id: int) -> str:
    year = datetime.now().year
    count = db.query(func.count(Invoice.id)).filter(
        Invoice.org_id == org_id,
        func.extract("year", Invoice.created_at) == year
    ).scalar() or 0
    return f"PLAN-{year}-{str(count + 1).zfill(4)}"


class PaginatedInvoices(BaseModel):
    items: List[InvoiceOut]
    total: int
    page: int
    pages: int
    per_page: int


@router.get("", response_model=PaginatedInvoices)
def list_invoices(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    lead_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Invoice).filter(Invoice.org_id == current_user.org_id)
    if lead_id is not None:
        # Lead workspace: all invoices attached to this lead in the org
        q = q.filter(Invoice.lead_id == lead_id)
    else:
        q = q.filter(Invoice.created_by == current_user.id)

    total = q.count()
    invoices = q.order_by(Invoice.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return PaginatedInvoices(
        items=invoices,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("", response_model=InvoiceOut, status_code=201)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = Invoice(
        invoice_number=_next_invoice_number(db, current_user.org_id),
        org_id=current_user.org_id,
        created_by=current_user.id,
        **payload.dict(),
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    if inv.lead_id:
        log_activity(
            db, org_id=current_user.org_id, lead_id=inv.lead_id,
            actor_id=current_user.id, type="invoice_created",
            title=f"Invoice {inv.invoice_number}",
            description=f"₹{inv.grand_total}" if inv.grand_total else None,
            ref_type="invoice", ref_id=inv.id,
        )
    return inv


@router.get("/{inv_id}")
def get_invoice(inv_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(
        Invoice.id == inv_id,
        Invoice.org_id == current_user.org_id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.put("/{inv_id}")
def update_invoice(
    inv_id: int,
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(
        Invoice.id == inv_id,
        Invoice.org_id == current_user.org_id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(inv, field, value)
    db.commit()
    db.refresh(inv)
    return inv
