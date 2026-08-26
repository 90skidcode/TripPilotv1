from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_permission
from app.models.lead import Lead
from app.models.lead_payment import LeadPayment
from app.models.lead_costing import LeadCosting
from app.models.lead_expense import LeadExpense, ExpenseCategory, ExpensePaymentStatus
from app.models.user import User

router = APIRouter()


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    title: str
    amount: float
    payment_status: ExpensePaymentStatus = ExpensePaymentStatus.paid
    payment_method: Optional[str] = "cash"
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


def _serialize_expense(e: LeadExpense) -> dict:
    return {
        "id": e.id,
        "lead_id": e.lead_id,
        "category": e.category.value if hasattr(e.category, "value") else str(e.category),
        "title": e.title,
        "amount": float(e.amount or 0.0),
        "payment_status": e.payment_status.value if hasattr(e.payment_status, "value") else str(e.payment_status),
        "payment_method": e.payment_method,
        "payment_date": e.payment_date.isoformat() if e.payment_date else None,
        "notes": e.notes,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


def _serialize_payment(p: LeadPayment) -> dict:
    return {
        "id": p.id,
        "lead_id": p.lead_id,
        "amount": float(p.amount or 0.0),
        "payment_type": p.payment_type.value if hasattr(p.payment_type, "value") else str(p.payment_type),
        "payment_method": p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method),
        "payment_date": p.payment_date.isoformat() if p.payment_date else None,
        "reference_number": p.reference_number,
        "notes": p.notes,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("/{lead_id}/financials")
def get_lead_financials(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    payments = db.query(LeadPayment).filter(LeadPayment.lead_id == lead_id).order_by(LeadPayment.payment_date.desc()).all()
    expenses = db.query(LeadExpense).filter(LeadExpense.lead_id == lead_id).order_by(LeadExpense.created_at.desc()).all()

    total_received = sum(float(p.amount or 0.0) for p in payments)
    total_expenses = sum(float(e.amount or 0.0) for e in expenses)

    customer_price = float(costing.customer_price or 0.0) if costing else 0.0
    if customer_price == 0 and total_received > 0:
        customer_price = total_received

    net_profit = round(customer_price - total_expenses, 2)
    margin_percent = round((net_profit / customer_price * 100), 1) if customer_price > 0 else 0.0
    customer_outstanding = max(0.0, round(customer_price - total_received, 2))

    # Expense category totals
    category_totals: dict[str, float] = {}
    for e in expenses:
        cat = e.category.value if hasattr(e.category, "value") else str(e.category)
        category_totals[cat] = category_totals.get(cat, 0.0) + float(e.amount or 0.0)

    return {
        "summary": {
            "customer_price": customer_price,
            "total_received": total_received,
            "total_expenses": round(total_expenses, 2),
            "net_profit": net_profit,
            "margin_percent": margin_percent,
            "customer_outstanding": customer_outstanding,
        },
        "category_totals": category_totals,
        "payments": [_serialize_payment(p) for p in payments],
        "expenses": [_serialize_expense(e) for e in expenses],
    }


@router.post("/{lead_id}/expenses", status_code=201)
def create_lead_expense(
    lead_id: int,
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    expense = LeadExpense(
        org_id=current_user.org_id,
        lead_id=lead_id,
        category=body.category,
        title=body.title,
        amount=body.amount,
        payment_status=body.payment_status,
        payment_method=body.payment_method or "cash",
        payment_date=body.payment_date or datetime.utcnow(),
        notes=body.notes,
        created_by=current_user.id,
    )
    db.add(expense)

    # Sync overall b2b_cost in LeadCosting table for backwards compatibility
    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    if not costing:
        costing = LeadCosting(lead_id=lead_id, b2b_cost=body.amount)
        db.add(costing)
    else:
        all_exp = db.query(LeadExpense).filter(LeadExpense.lead_id == lead_id).all()
        costing.b2b_cost = sum(float(e.amount or 0.0) for e in all_exp) + body.amount

    db.commit()
    db.refresh(expense)
    return _serialize_expense(expense)


@router.delete("/{lead_id}/expenses/{expense_id}", status_code=204)
def delete_lead_expense(
    lead_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    expense = db.query(LeadExpense).filter(
        LeadExpense.id == expense_id,
        LeadExpense.lead_id == lead_id,
        LeadExpense.org_id == current_user.org_id,
    ).first()
    if not expense:
        raise HTTPException(404, "Expense record not found")

    db.delete(expense)

    # Recalculate costing b2b_cost
    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    if costing:
        remaining_exp = db.query(LeadExpense).filter(LeadExpense.lead_id == lead_id, LeadExpense.id != expense_id).all()
        costing.b2b_cost = sum(float(e.amount or 0.0) for e in remaining_exp)

    db.commit()
