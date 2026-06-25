import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.models.inventory import HotelInventory, HotelRoomCategory, ActivityInventory, ActivityItem
from app.models.user import User

router = APIRouter()

MEAL_PLANS = ["EP", "CP", "MAP", "AP", "AI"]

# ─── Hotel Inventory ─────────────────────────────────────────────────────────

class RoomCategoryIn(BaseModel):
    room_category_name: str
    meal_plan: Optional[str] = None
    selling_price_weekday: Optional[float] = None
    selling_price_weekend: Optional[float] = None


class RoomCategoryOut(BaseModel):
    id: int
    room_category_name: str
    meal_plan: Optional[str]
    selling_price_weekday: Optional[float]
    selling_price_weekend: Optional[float]

    class Config:
        from_attributes = True


class HotelIn(BaseModel):
    hotel_name: str
    city: str
    country: str
    star_rating: Optional[int] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None
    room_categories: List[RoomCategoryIn] = []


class HotelOut(BaseModel):
    id: int
    hotel_name: str
    city: str
    country: str
    star_rating: Optional[int]
    supplier_name: Optional[str]
    room_categories: List[RoomCategoryOut] = []

    class Config:
        from_attributes = True


class PaginatedHotels(BaseModel):
    items: List[HotelOut]
    total: int
    page: int
    pages: int
    per_page: int


def _serialize_hotel(h: HotelInventory) -> dict:
    return {
        "id": h.id,
        "hotel_name": h.hotel_name,
        "city": h.city,
        "country": h.country,
        "star_rating": h.star_rating,
        "supplier_name": h.supplier_name,
        "room_categories": [
            {
                "id": rc.id,
                "room_category_name": rc.room_category_name,
                "meal_plan": rc.meal_plan,
                "selling_price_weekday": rc.selling_price_weekday,
                "selling_price_weekend": rc.selling_price_weekend,
            }
            for rc in (h.room_categories or [])
        ],
    }


@router.get("/hotels", response_model=PaginatedHotels)
def list_hotels(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "read")),
):
    q = db.query(HotelInventory).filter(HotelInventory.org_id == current_user.org_id)
    if search:
        q = q.filter(HotelInventory.hotel_name.ilike(f"%{search}%"))
    if city:
        q = q.filter(HotelInventory.city.ilike(f"%{city}%"))
    if country:
        q = q.filter(HotelInventory.country.ilike(f"%{country}%"))

    total = q.count()
    hotels = q.order_by(HotelInventory.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedHotels(
        items=[_serialize_hotel(h) for h in hotels],
        total=total,
        page=page,
        pages=max(1, (total + per_page - 1) // per_page),
        per_page=per_page,
    )


@router.post("/hotels", response_model=HotelOut, status_code=201)
def create_hotel(payload: HotelIn, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    data = payload.dict(exclude={"room_categories"})
    h = HotelInventory(**data, org_id=current_user.org_id)
    db.add(h)
    db.flush()
    for rc in payload.room_categories:
        db.add(HotelRoomCategory(hotel_id=h.id, **rc.dict()))
    db.commit()
    db.refresh(h)
    return _serialize_hotel(h)


@router.put("/hotels/{hotel_id}", response_model=HotelOut)
def update_hotel(hotel_id: int, payload: HotelIn, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    h = db.query(HotelInventory).filter(HotelInventory.id == hotel_id, HotelInventory.org_id == current_user.org_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotel not found")
    for k, v in payload.dict(exclude={"room_categories"}, exclude_unset=True).items():
        setattr(h, k, v)
    # Replace all room categories
    db.query(HotelRoomCategory).filter(HotelRoomCategory.hotel_id == hotel_id).delete()
    for rc in payload.room_categories:
        db.add(HotelRoomCategory(hotel_id=hotel_id, **rc.dict()))
    db.commit()
    db.refresh(h)
    return _serialize_hotel(h)


@router.delete("/hotels/{hotel_id}", status_code=204)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    h = db.query(HotelInventory).filter(HotelInventory.id == hotel_id, HotelInventory.org_id == current_user.org_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db.delete(h)
    db.commit()


@router.get("/hotels/export/csv")
def export_hotels_csv(db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "read"))):
    hotels = db.query(HotelInventory).filter(HotelInventory.org_id == current_user.org_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["hotel_name", "city", "country", "star_rating", "supplier_name", "room_category_name", "meal_plan", "selling_price_weekday", "selling_price_weekend"])
    for h in hotels:
        if h.room_categories:
            for rc in h.room_categories:
                writer.writerow([h.hotel_name, h.city, h.country, h.star_rating, h.supplier_name, rc.room_category_name, rc.meal_plan, rc.selling_price_weekday, rc.selling_price_weekend])
        else:
            writer.writerow([h.hotel_name, h.city, h.country, h.star_rating, h.supplier_name, "", "", "", ""])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=hotels.csv"})


@router.post("/hotels/import/csv", status_code=201)
def import_hotels_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    for row in reader:
        h = HotelInventory(
            org_id=current_user.org_id,
            hotel_name=row.get("hotel_name", "Unknown"),
            city=row.get("city", "Unknown"),
            country=row.get("country", "Unknown"),
            star_rating=int(row["star_rating"]) if row.get("star_rating") else None,
            supplier_name=row.get("supplier_name"),
        )
        db.add(h)
        db.flush()
        if row.get("room_category_name"):
            db.add(HotelRoomCategory(
                hotel_id=h.id,
                room_category_name=row["room_category_name"],
                meal_plan=row.get("meal_plan"),
                selling_price_weekday=float(row["selling_price_weekday"]) if row.get("selling_price_weekday") else None,
                selling_price_weekend=float(row["selling_price_weekend"]) if row.get("selling_price_weekend") else None,
            ))
        created += 1
    db.commit()
    return {"created": created}


# ─── Activity Inventory ───────────────────────────────────────────────────────

class ActivityItemIn(BaseModel):
    activity_name: str
    activity_type: Optional[str] = None
    duration: Optional[str] = None
    selling_price_adult: Optional[float] = None
    selling_price_child: Optional[float] = None


class ActivityItemOut(BaseModel):
    id: int
    activity_name: str
    activity_type: Optional[str]
    duration: Optional[str]
    selling_price_adult: Optional[float]
    selling_price_child: Optional[float]

    class Config:
        from_attributes = True


class ActivityIn(BaseModel):
    vendor_name: str
    city: str
    country: str
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None
    activity_items: List[ActivityItemIn] = []


class ActivityOut(BaseModel):
    id: int
    vendor_name: str
    city: str
    country: str
    supplier_name: Optional[str]
    activity_items: List[ActivityItemOut] = []

    class Config:
        from_attributes = True


class PaginatedActivities(BaseModel):
    items: List[ActivityOut]
    total: int
    page: int
    pages: int
    per_page: int


def _serialize_activity(a: ActivityInventory) -> dict:
    return {
        "id": a.id,
        "vendor_name": a.vendor_name,
        "city": a.city,
        "country": a.country,
        "supplier_name": a.supplier_name,
        "activity_items": [
            {
                "id": ai.id,
                "activity_name": ai.activity_name,
                "activity_type": ai.activity_type,
                "duration": ai.duration,
                "selling_price_adult": ai.selling_price_adult,
                "selling_price_child": ai.selling_price_child,
            }
            for ai in (a.activity_items or [])
        ],
    }


@router.get("/activities", response_model=PaginatedActivities)
def list_activities(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "read")),
):
    q = db.query(ActivityInventory).filter(ActivityInventory.org_id == current_user.org_id)
    if search:
        q = q.filter(ActivityInventory.vendor_name.ilike(f"%{search}%"))

    total = q.count()
    activities = q.order_by(ActivityInventory.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedActivities(
        items=[_serialize_activity(a) for a in activities],
        total=total,
        page=page,
        pages=max(1, (total + per_page - 1) // per_page),
        per_page=per_page,
    )


@router.post("/activities", response_model=ActivityOut, status_code=201)
def create_activity(
    payload: ActivityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    data = payload.dict(exclude={"activity_items"})
    a = ActivityInventory(**data, org_id=current_user.org_id)
    db.add(a)
    db.flush()
    for ai in payload.activity_items:
        db.add(ActivityItem(activity_id=a.id, **ai.dict()))
    db.commit()
    db.refresh(a)
    return _serialize_activity(a)


@router.put("/activities/{act_id}", response_model=ActivityOut)
def update_activity(
    act_id: int,
    payload: ActivityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    a = db.query(ActivityInventory).filter(
        ActivityInventory.id == act_id,
        ActivityInventory.org_id == current_user.org_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    for k, v in payload.dict(exclude={"activity_items"}, exclude_unset=True).items():
        setattr(a, k, v)
    db.query(ActivityItem).filter(ActivityItem.activity_id == act_id).delete()
    for ai in payload.activity_items:
        db.add(ActivityItem(activity_id=act_id, **ai.dict()))
    db.commit()
    db.refresh(a)
    return _serialize_activity(a)


@router.delete("/activities/{act_id}", status_code=204)
def delete_activity(
    act_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    a = db.query(ActivityInventory).filter(
        ActivityInventory.id == act_id,
        ActivityInventory.org_id == current_user.org_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(a)
    db.commit()
