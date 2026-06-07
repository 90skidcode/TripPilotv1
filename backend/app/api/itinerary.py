from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.itinerary import Itinerary
from app.models.user import User

router = APIRouter()


class ItineraryCreate(BaseModel):
    title: str
    layout: str = "visual_experience"
    lead_id: Optional[int] = None
    cover_image_url: Optional[str] = None
    cover_title: Optional[str] = None
    cover_subheading: Optional[str] = None
    destination: Optional[str] = None
    num_travellers: Optional[int] = None
    total_days: Optional[int] = None
    total_nights: Optional[int] = None
    package_cost: Optional[str] = None
    per_person_cost: Optional[str] = None
    gst_percent: Optional[int] = 5
    payment_terms: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    meals_summary: Optional[Any] = None
    ferry_blocks: Optional[Any] = None
    flights: Optional[Any] = None
    stay_options: Optional[Any] = None
    days: Optional[Any] = None


class ItineraryOut(BaseModel):
    id: int
    title: str
    layout: str
    lead_id: Optional[int]
    cover_image_url: Optional[str]
    cover_title: Optional[str]
    cover_subheading: Optional[str]
    destination: Optional[str]
    num_travellers: Optional[int]
    total_days: Optional[int]
    total_nights: Optional[int]
    package_cost: Optional[str]
    per_person_cost: Optional[str]
    gst_percent: Optional[int]
    payment_terms: Optional[str]
    inclusions: Optional[str]
    exclusions: Optional[str]
    meals_summary: Optional[Any]
    ferry_blocks: Optional[Any]
    flights: Optional[Any]
    stay_options: Optional[Any]
    days: Optional[Any]
    share_url: Optional[str]
    pdf_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateRequest(BaseModel):
    raw_text: str
    layout: str = "visual_experience"
    lead_id: Optional[int] = None


@router.get("")
def list_itineraries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itinerary", "read")),
):
    items = db.query(Itinerary).filter(
        Itinerary.org_id == current_user.org_id,
        Itinerary.created_by == current_user.id
    ).order_by(Itinerary.created_at.desc()).all()
    return items


@router.post("", response_model=ItineraryOut, status_code=201)
def create_itinerary(
    payload: ItineraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itinerary", "write")),
):
    itin = Itinerary(**payload.dict(), created_by=current_user.id, org_id=current_user.org_id)
    db.add(itin)
    db.commit()
    db.refresh(itin)
    return itin


@router.get("/{itin_id}", response_model=ItineraryOut)
def get_itinerary(itin_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("itinerary", "read"))):
    itin = db.query(Itinerary).filter(Itinerary.id == itin_id, Itinerary.org_id == current_user.org_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itin


@router.put("/{itin_id}", response_model=ItineraryOut)
def update_itinerary(
    itin_id: int,
    payload: ItineraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itinerary", "write")),
):
    itin = db.query(Itinerary).filter(Itinerary.id == itin_id, Itinerary.org_id == current_user.org_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(itin, field, value)
    db.commit()
    db.refresh(itin)
    return itin


@router.delete("/{itin_id}", status_code=204)
def delete_itinerary(itin_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("itinerary", "write"))):
    itin = db.query(Itinerary).filter(Itinerary.id == itin_id, Itinerary.org_id == current_user.org_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    db.delete(itin)
    db.commit()


@router.post("/generate", response_model=ItineraryOut, status_code=201)
async def generate_itinerary(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itinerary", "write")),
):
    """AI-powered itinerary generation from raw text using Gemini."""
    from app.services.ai_service import generate_itinerary as ai_generate

    data = await ai_generate(payload.raw_text, payload.layout)

    itin = Itinerary(
        org_id=current_user.org_id,
        title=data.get("title", "New Itinerary"),
        layout=payload.layout,
        lead_id=payload.lead_id,
        cover_image_url=data.get("cover_image_url"),
        cover_title=data.get("cover_title"),
        cover_subheading=data.get("cover_subheading"),
        destination=data.get("destination"),
        num_travellers=data.get("num_travellers"),
        total_days=data.get("total_days"),
        total_nights=data.get("total_nights"),
        meals_summary=data.get("meals_summary"),
        flights=data.get("flights"),
        stay_options=data.get("stay_options"),
        days=data.get("days"),
        created_by=current_user.id,
    )
    db.add(itin)
    db.commit()
    db.refresh(itin)
    return itin


class ChatEditRequest(BaseModel):
    command: str


@router.post("/{itin_id}/chat-edit", response_model=ItineraryOut)
async def chat_edit_itinerary(
    itin_id: int,
    payload: ChatEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("itinerary", "write")),
):
    """Apply a natural language command to edit an existing itinerary via Gemini."""
    from app.services.ai_service import edit_itinerary_with_chat
    import json

    itin = db.query(Itinerary).filter(Itinerary.id == itin_id, Itinerary.org_id == current_user.org_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")

    current = {
        "title": itin.title,
        "days": itin.days or [],
        "flights": itin.flights or {},
        "stay_options": itin.stay_options or [],
        "meals_summary": itin.meals_summary or {},
        "ferry_blocks": itin.ferry_blocks or [],
    }

    updated = await edit_itinerary_with_chat(current, payload.command)

    # Apply updates back
    if "title" in updated:
        itin.title = updated["title"]
    if "days" in updated:
        itin.days = updated["days"]
    if "flights" in updated:
        itin.flights = updated["flights"]
    if "stay_options" in updated:
        itin.stay_options = updated["stay_options"]
    if "meals_summary" in updated:
        itin.meals_summary = updated["meals_summary"]
    if "ferry_blocks" in updated:
        itin.ferry_blocks = updated["ferry_blocks"]

    db.commit()
    db.refresh(itin)
    return itin
