from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_permission
from app.models.tools import FlightTicket
from app.models.user import User
from app.services.activity import log_activity

router = APIRouter()

NOT_FOUND = "Flight ticket not found"


class FlightCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    airline: str
    flight_number: Optional[str] = None
    pnr: Optional[str] = None
    cabin_class: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    depart_at: Optional[datetime] = None
    arrive_at: Optional[datetime] = None
    num_passengers: Optional[int] = None
    passengers: Optional[Any] = None
    fare: Optional[str] = None
    baggage: Optional[str] = None
    notes: Optional[str] = None
    extra_data: Optional[Any] = None


class FlightOut(BaseModel):
    id: int
    lead_id: Optional[int]
    customer_id: Optional[int]
    airline: str
    flight_number: Optional[str]
    pnr: Optional[str]
    cabin_class: Optional[str]
    origin: Optional[str]
    destination: Optional[str]
    depart_at: Optional[datetime]
    arrive_at: Optional[datetime]
    num_passengers: Optional[int]
    passengers: Optional[Any]
    fare: Optional[str]
    baggage: Optional[str]
    notes: Optional[str]
    extra_data: Optional[Any]
    pdf_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedFlights(BaseModel):
    items: List[FlightOut]
    total: int
    page: int
    pages: int
    per_page: int


def _log_flight(db, flight, current_user):
    if flight.lead_id:
        route = " → ".join([p for p in [flight.origin, flight.destination] if p])
        log_activity(
            db, org_id=current_user.org_id, lead_id=flight.lead_id,
            customer_id=flight.customer_id, actor_id=current_user.id,
            type="flight_created", title=f"Flight ticket: {flight.airline}",
            description=route or flight.flight_number or None,
            ref_type="flight", ref_id=flight.id,
        )


@router.get("", response_model=PaginatedFlights)
def list_flights(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    lead_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "read")),
):
    q = db.query(FlightTicket).filter(FlightTicket.org_id == current_user.org_id)
    if lead_id is not None:
        q = q.filter(FlightTicket.lead_id == lead_id)
    else:
        q = q.filter(FlightTicket.created_by == current_user.id)

    total = q.count()
    flights = q.order_by(FlightTicket.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedFlights(
        items=flights,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("", response_model=FlightOut, status_code=201)
def create_flight(
    payload: FlightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "write")),
):
    flight = FlightTicket(**payload.dict(), created_by=current_user.id, org_id=current_user.org_id)
    db.add(flight)
    db.commit()
    db.refresh(flight)
    _log_flight(db, flight, current_user)
    return flight


@router.get("/{flight_id}", response_model=FlightOut)
def get_flight(flight_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("vouchers", "read"))):
    flight = db.query(FlightTicket).filter(
        FlightTicket.id == flight_id, FlightTicket.org_id == current_user.org_id
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return flight


@router.put("/{flight_id}", response_model=FlightOut)
def update_flight(
    flight_id: int,
    payload: FlightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "write")),
):
    flight = db.query(FlightTicket).filter(
        FlightTicket.id == flight_id, FlightTicket.org_id == current_user.org_id
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(flight, field, value)
    db.commit()
    db.refresh(flight)
    return flight


@router.delete("/{flight_id}", status_code=204)
def delete_flight(flight_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("vouchers", "write"))):
    flight = db.query(FlightTicket).filter(
        FlightTicket.id == flight_id, FlightTicket.org_id == current_user.org_id
    ).first()
    if not flight:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    db.delete(flight)
    db.commit()
