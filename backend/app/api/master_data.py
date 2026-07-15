from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_superadmin
from app.models.user import User
from app.models.master_data import MasterData

router = APIRouter()


class MasterDataCreate(BaseModel):
    category: str
    key: str
    label: str
    description: str | None = None
    order: int = 0


class MasterDataUpdate(BaseModel):
    label: str | None = None
    description: str | None = None
    order: int | None = None
    is_active: bool | None = None


class MasterDataOut(BaseModel):
    id: int
    category: str
    key: str
    label: str
    description: str | None
    order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/categories", response_model=List[str])
def list_categories(
    db: Session = Depends(get_db),
):
    """Get all master data categories."""
    categories = db.query(MasterData.category).filter(MasterData.is_active == True).distinct().all()
    return [c[0] for c in categories]


@router.get("", response_model=List[MasterDataOut])
def list_master_data(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """Get master data. Optionally filter by category."""
    query = db.query(MasterData).filter(MasterData.is_active == True)
    if category:
        query = query.filter(MasterData.category == category)
    query = query.order_by(MasterData.order, MasterData.created_at)
    return query.all()


@router.get("/{category}", response_model=List[MasterDataOut])
def get_by_category(
    category: str,
    db: Session = Depends(get_db),
):
    """Get all master data for a specific category."""
    data = db.query(MasterData).filter(
        and_(
            MasterData.category == category,
            MasterData.is_active == True
        )
    ).order_by(MasterData.order, MasterData.created_at).all()
    return data


@router.post("", response_model=MasterDataOut, status_code=201)
def create_master_data(
    payload: MasterDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create master data - superadmin only."""
    # Check if key already exists in category
    existing = db.query(MasterData).filter(
        and_(
            MasterData.category == payload.category,
            MasterData.key == payload.key
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Key '{payload.key}' already exists in category '{payload.category}'"
        )

    data = MasterData(
        category=payload.category,
        key=payload.key,
        label=payload.label,
        description=payload.description,
        order=payload.order,
    )
    db.add(data)
    db.commit()
    db.refresh(data)
    return data


@router.put("/{data_id}", response_model=MasterDataOut)
def update_master_data(
    data_id: int,
    payload: MasterDataUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update master data - superadmin only."""
    data = db.query(MasterData).filter(MasterData.id == data_id).first()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master data not found"
        )

    if payload.label is not None:
        data.label = payload.label
    if payload.description is not None:
        data.description = payload.description
    if payload.order is not None:
        data.order = payload.order
    if payload.is_active is not None:
        data.is_active = payload.is_active

    data.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(data)
    return data


@router.delete("/{data_id}", status_code=204)
def delete_master_data(
    data_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Delete master data (soft delete) - superadmin only."""
    data = db.query(MasterData).filter(MasterData.id == data_id).first()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Master data not found"
        )

    data.is_active = False
    data.updated_at = datetime.utcnow()
    db.commit()


@router.post("/seed", status_code=201)
def seed_master_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Seed default master data - superadmin only."""
    default_data = [
        # Lead Stages
        ("lead_stages", "fresh", "Fresh Lead"),
        ("lead_stages", "qualified_hot", "Qualified Hot"),
        ("lead_stages", "qualified_warm", "Qualified Warm"),
        ("lead_stages", "won", "Won"),
        ("lead_stages", "lost", "Lost"),
        ("lead_stages", "not_responding", "Not Responding"),
        ("lead_stages", "disqualified", "Disqualified"),
        ("lead_stages", "future_prospect", "Future Prospect"),

        # Payment Types
        ("payment_types", "full", "Full Payment"),
        ("payment_types", "partial", "Partial Payment"),

        # Payment Methods
        ("payment_methods", "cash", "Cash"),
        ("payment_methods", "upi", "UPI"),
        ("payment_methods", "bank_transfer", "Bank Transfer"),
        ("payment_methods", "card", "Card"),
        ("payment_methods", "cheque", "Cheque"),
        ("payment_methods", "other", "Other"),
    ]

    for category, key, label in default_data:
        existing = db.query(MasterData).filter(
            and_(
                MasterData.category == category,
                MasterData.key == key
            )
        ).first()
        if not existing:
            data = MasterData(
                category=category,
                key=key,
                label=label,
            )
            db.add(data)

    db.commit()
    return {"message": "Master data seeded successfully"}
