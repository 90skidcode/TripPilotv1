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
from app.models.inventory import HotelInventory, ActivityInventory
from app.models.user import User

router = APIRouter()


# ─── Hotel Inventory ─────────────────────────────────────────────────────────

class HotelIn(BaseModel):
    hotel_name: str
    city: str
    country: str
    star_rating: Optional[int] = None
    room_category_name: Optional[str] = None
    meal_plan: Optional[str] = None
    selling_price_weekday: Optional[float] = None
    selling_price_weekend: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None


class HotelOut(BaseModel):
    id: int
    hotel_name: str
    city: str
    country: str
    star_rating: Optional[int]
    room_category_name: Optional[str]
    meal_plan: Optional[str]
    selling_price_weekday: Optional[float]
    selling_price_weekend: Optional[float]
    supplier_name: Optional[str]

    class Config:
        from_attributes = True


class PaginatedHotels(BaseModel):
    items: List[HotelOut]
    total: int
    page: int
    pages: int
    per_page: int


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
        items=hotels,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("/hotels", response_model=HotelOut, status_code=201)
def create_hotel(payload: HotelIn, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    h = HotelInventory(**payload.dict(), org_id=current_user.org_id)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/hotels/{hotel_id}", response_model=HotelOut)
def update_hotel(hotel_id: int, payload: HotelIn, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    h = db.query(HotelInventory).filter(HotelInventory.id == hotel_id, HotelInventory.org_id == current_user.org_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotel not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(h, k, v)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/hotels/{hotel_id}", status_code=204)
def delete_hotel(hotel_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "write"))):
    h = db.query(HotelInventory).filter(HotelInventory.id == hotel_id, HotelInventory.org_id == current_user.org_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hotel not found")
    db.delete(h)
    db.commit()


@router.get("/hotels/export/csv")
def export_hotels_csv(db: Session = Depends(get_db), current_user: User = Depends(require_permission("inventory", "read"))):
    hotels = db.query(HotelInventory).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["hotel_name", "city", "country", "star_rating", "room_category_name", "meal_plan", "selling_price_weekday", "selling_price_weekend", "supplier_name"])
    for h in hotels:
        writer.writerow([h.hotel_name, h.city, h.country, h.star_rating, h.room_category_name, h.meal_plan, h.selling_price_weekday, h.selling_price_weekend, h.supplier_name])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=hotels.csv"})


@router.post("/hotels/import/csv", status_code=201)
def import_hotels_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    for row in reader:
        h = HotelInventory(
            hotel_name=row.get("hotel_name", "Unknown"),
            city=row.get("city", "Unknown"),
            country=row.get("country", "Unknown"),
            star_rating=int(row["star_rating"]) if row.get("star_rating") else None,
            room_category_name=row.get("room_category_name"),
            meal_plan=row.get("meal_plan"),
            selling_price_weekday=float(row["selling_price_weekday"]) if row.get("selling_price_weekday") else None,
            selling_price_weekend=float(row["selling_price_weekend"]) if row.get("selling_price_weekend") else None,
            supplier_name=row.get("supplier_name"),
        )
        db.add(h)
        created += 1
    db.commit()
    return {"created": created}


# ─── Activity Inventory ───────────────────────────────────────────────────────

class ActivityIn(BaseModel):
    activity_name: str
    city: str
    country: str
    duration: Optional[str] = None
    activity_type: Optional[str] = None
    selling_price_adult: Optional[float] = None
    selling_price_child: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    activity_name: str
    city: str
    country: str
    duration: Optional[str]
    activity_type: Optional[str]
    selling_price_adult: Optional[float]
    selling_price_child: Optional[float]
    supplier_name: Optional[str]

    class Config:
        from_attributes = True


class PaginatedActivities(BaseModel):
    items: List[ActivityOut]
    total: int
    page: int
    pages: int
    per_page: int


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
        q = q.filter(ActivityInventory.activity_name.ilike(f"%{search}%"))
        
    total = q.count()
    activities = q.order_by(ActivityInventory.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return PaginatedActivities(
        items=activities,
        total=total,
        page=page,
        pages=(total + per_page - 1) // per_page,
        per_page=per_page,
    )


@router.post("/activities", response_model=ActivityOut, status_code=201)
def create_activity(
    payload: ActivityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    a = ActivityInventory(**payload.dict(), org_id=current_user.org_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.put("/activities/{act_id}", response_model=ActivityOut)
def update_activity(
    act_id: int,
    payload: ActivityIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    a = db.query(ActivityInventory).filter(
        ActivityInventory.id == act_id,
        ActivityInventory.org_id == current_user.org_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/activities/{act_id}", status_code=204)
def delete_activity(
    act_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "write")),
):
    a = db.query(ActivityInventory).filter(
        ActivityInventory.id == act_id,
        ActivityInventory.org_id == current_user.org_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(a)
    db.commit()
