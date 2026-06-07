from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_permission
from app.models.lead import Lead
from app.models.lead_costing import LeadCosting
from app.models.user import User

router = APIRouter()


class CostingInput(BaseModel):
    b2b_cost: Optional[float] = 0
    customer_price: Optional[float] = 0
    currency: Optional[str] = "INR"
    cost_breakdown: Optional[Any] = None
    notes: Optional[str] = None


class CostingOut(BaseModel):
    id: int
    lead_id: int
    b2b_cost: float
    customer_price: float
    margin: float
    currency: str
    cost_breakdown: Optional[Any] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/{lead_id}/costing", response_model=CostingOut)
def get_lead_costing(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "read")),
):
    """Get costing for a specific lead."""
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.org_id == current_user.org_id,
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    if not costing:
        # Return empty costing
        return {
            "id": 0,
            "lead_id": lead_id,
            "b2b_cost": 0,
            "customer_price": 0,
            "margin": 0,
            "currency": "INR",
            "cost_breakdown": None,
            "notes": None,
            "created_at": None,
            "updated_at": None,
        }

    return {
        "id": costing.id,
        "lead_id": costing.lead_id,
        "b2b_cost": costing.b2b_cost or 0,
        "customer_price": costing.customer_price or 0,
        "margin": (costing.customer_price or 0) - (costing.b2b_cost or 0),
        "currency": costing.currency or "INR",
        "cost_breakdown": costing.cost_breakdown,
        "notes": costing.notes,
        "created_at": costing.created_at,
        "updated_at": costing.updated_at,
    }


@router.put("/{lead_id}/costing", response_model=CostingOut)
def upsert_lead_costing(
    lead_id: int,
    payload: CostingInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("leads", "write")),
):
    """Create or update costing for a lead."""
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.org_id == current_user.org_id,
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    costing = db.query(LeadCosting).filter(LeadCosting.lead_id == lead_id).first()
    if not costing:
        costing = LeadCosting(lead_id=lead_id)
        db.add(costing)

    costing.b2b_cost = payload.b2b_cost or 0
    costing.customer_price = payload.customer_price or 0
    costing.currency = payload.currency or "INR"
    costing.cost_breakdown = payload.cost_breakdown
    costing.notes = payload.notes

    db.commit()
    db.refresh(costing)

    return {
        "id": costing.id,
        "lead_id": costing.lead_id,
        "b2b_cost": costing.b2b_cost or 0,
        "customer_price": costing.customer_price or 0,
        "margin": (costing.customer_price or 0) - (costing.b2b_cost or 0),
        "currency": costing.currency or "INR",
        "cost_breakdown": costing.cost_breakdown,
        "notes": costing.notes,
        "created_at": costing.created_at,
        "updated_at": costing.updated_at,
    }
