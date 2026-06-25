from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.lead_payment import LeadPayment, PaymentType, PaymentMethod
from app.models.lead import Lead
from app.models.user import User

router = APIRouter()


class PaymentCreate(BaseModel):
    amount: float
    payment_type: PaymentType
    payment_method: PaymentMethod = PaymentMethod.cash
    payment_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


def _serialize(p: LeadPayment) -> dict:
    return {
        "id": p.id,
        "lead_id": p.lead_id,
        "amount": p.amount,
        "payment_type": p.payment_type,
        "payment_method": p.payment_method,
        "payment_date": p.payment_date.isoformat() if p.payment_date else None,
        "reference_number": p.reference_number,
        "notes": p.notes,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/{lead_id}/payments")
def list_payments(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    from app.models.lead_costing import LeadCosting
    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    payments = db.query(LeadPayment).filter(LeadPayment.lead_id == lead_id).order_by(LeadPayment.payment_date.desc()).all()
    total_paid = sum(p.amount for p in payments)
    return {
        "payments": [_serialize(p) for p in payments],
        "total_paid": total_paid,
        "customer_price": costing.customer_price if costing else 0,
    }


@router.post("/{lead_id}/payments", status_code=201)
def create_payment(
    lead_id: int,
    body: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    payment = LeadPayment(
        org_id=current_user.org_id,
        lead_id=lead_id,
        amount=body.amount,
        payment_type=body.payment_type,
        payment_method=body.payment_method,
        payment_date=body.payment_date or datetime.utcnow(),
        reference_number=body.reference_number,
        notes=body.notes,
        created_by=current_user.id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _serialize(payment)


@router.delete("/{lead_id}/payments/{payment_id}", status_code=204)
def delete_payment(
    lead_id: int,
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    payment = db.query(LeadPayment).filter(
        LeadPayment.id == payment_id,
        LeadPayment.lead_id == lead_id,
        LeadPayment.org_id == current_user.org_id,
    ).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    db.delete(payment)
    db.commit()
