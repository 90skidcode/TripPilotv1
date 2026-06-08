from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.tools import HotelVoucher
from app.models.customer import Customer
from app.models.user import User
from app.services.activity import log_activity

router = APIRouter()


def _log_voucher(db, voucher, current_user):
    if voucher.lead_id:
        log_activity(
            db, org_id=current_user.org_id, lead_id=voucher.lead_id,
            customer_id=voucher.customer_id, actor_id=current_user.id,
            type="voucher_created", title=f"Hotel voucher: {voucher.hotel_name}",
            description=voucher.room_type or None,
            ref_type="voucher", ref_id=voucher.id,
        )


class VoucherCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    hotel_name: str
    hotel_stars: Optional[int] = None
    hotel_address: Optional[str] = None
    banner_image_url: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    room_type: Optional[str] = None
    num_rooms: Optional[int] = None
    num_guests: Optional[int] = None
    meal_plan: Optional[str] = None
    cancellation_policy: Optional[str] = None
    special_requests: Optional[str] = None
    extra_data: Optional[Any] = None


class VoucherOut(BaseModel):
    id: int
    hotel_name: str
    hotel_stars: Optional[int]
    hotel_address: Optional[str]
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    room_type: Optional[str]
    num_rooms: Optional[int]
    num_guests: Optional[int]
    meal_plan: Optional[str]
    cancellation_policy: Optional[str]
    special_requests: Optional[str]
    extra_data: Optional[Any]
    pdf_url: Optional[str]
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIVoucherInput(BaseModel):
    description: str
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None


class PaginatedVouchers(BaseModel):
    items: List[VoucherOut]
    total: int
    page: int
    pages: int
    per_page: int


@router.get("", response_model=PaginatedVouchers)
def list_vouchers(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    lead_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "read")),
):
    q = db.query(HotelVoucher).filter(HotelVoucher.org_id == current_user.org_id)
    if lead_id is not None:
        # Lead workspace: all vouchers attached to this lead in the org
        q = q.filter(HotelVoucher.lead_id == lead_id)
    else:
        q = q.filter(HotelVoucher.created_by == current_user.id)

    total = q.count()
    vouchers = q.order_by(HotelVoucher.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for v in vouchers:
        d = {
            "id": v.id,
            "hotel_name": v.hotel_name,
            "hotel_stars": v.hotel_stars,
            "hotel_address": v.hotel_address,
            "check_in": v.check_in,
            "check_out": v.check_out,
            "room_type": v.room_type,
            "num_rooms": v.num_rooms,
            "num_guests": v.num_guests,
            "meal_plan": v.meal_plan,
            "cancellation_policy": v.cancellation_policy,
            "special_requests": v.special_requests,
            "extra_data": v.extra_data,
            "pdf_url": v.pdf_url,
            "customer_id": v.customer_id,
            "customer_name": v.customer.name if v.customer else None,
            "customer_phone": v.customer.phone if v.customer else None,
            "created_at": v.created_at,
        }
        items.append(d)

    return PaginatedVouchers(
        items=items,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("", response_model=VoucherOut, status_code=201)
def create_voucher(
    payload: VoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "write")),
):
    voucher = HotelVoucher(**payload.dict(), created_by=current_user.id, org_id=current_user.org_id)
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    _log_voucher(db, voucher, current_user)
    return voucher


@router.get("/{voucher_id}", response_model=VoucherOut)
def get_voucher(voucher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("vouchers", "read"))):
    v = db.query(HotelVoucher).filter(HotelVoucher.id == voucher_id, HotelVoucher.org_id == current_user.org_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return v


@router.delete("/{voucher_id}", status_code=204)
def delete_voucher(voucher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("vouchers", "write"))):
    v = db.query(HotelVoucher).filter(HotelVoucher.id == voucher_id, HotelVoucher.org_id == current_user.org_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Voucher not found")
    db.delete(v)
    db.commit()


@router.put("/{voucher_id}", response_model=VoucherOut)
def update_voucher(
    voucher_id: int,
    payload: VoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "write")),
):
    v = db.query(HotelVoucher).filter(HotelVoucher.id == voucher_id, HotelVoucher.org_id == current_user.org_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    # Update all attributes from payload
    for k, val in payload.dict().items():
        setattr(v, k, val)
        
    db.commit()
    db.refresh(v)
    return v


@router.post("/ai", response_model=VoucherOut, status_code=201)
async def ai_voucher(
    payload: AIVoucherInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vouchers", "write")),
):
    """AI parse booking description into a hotel voucher using Gemini."""
    from app.services.ai_service import parse_hotel_voucher
    from datetime import datetime as dt

    parsed = await parse_hotel_voucher(payload.description)

    def parse_date(val):
        if not val:
            return None
        try:
            return dt.strptime(val, "%Y-%m-%d")
        except Exception:
            return None

    voucher = HotelVoucher(
        org_id=current_user.org_id,
        lead_id=payload.lead_id,
        customer_id=payload.customer_id,
        hotel_name=parsed.get("hotel_name") or "Unknown Hotel",
        hotel_stars=parsed.get("hotel_stars"),
        hotel_address=parsed.get("hotel_address"),
        check_in=parse_date(parsed.get("check_in")),
        check_out=parse_date(parsed.get("check_out")),
        room_type=parsed.get("room_type"),
        num_rooms=parsed.get("num_rooms"),
        num_guests=parsed.get("num_guests"),
        meal_plan=parsed.get("meal_plan"),
        cancellation_policy=parsed.get("cancellation_policy"),
        special_requests=parsed.get("special_requests"),
        extra_data={"raw": payload.description},
        created_by=current_user.id,
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    _log_voucher(db, voucher, current_user)
    return voucher
