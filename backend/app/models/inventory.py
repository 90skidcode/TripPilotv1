from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class HotelRoomCategory(Base):
    __tablename__ = "hotel_room_categories"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotel_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    room_category_name = Column(String(200), nullable=False)
    meal_plan = Column(String(100), nullable=True)
    selling_price_weekday = Column(Float, nullable=True)
    selling_price_weekend = Column(Float, nullable=True)


class HotelInventory(Base):
    __tablename__ = "hotel_inventory"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    hotel_name = Column(String(300), nullable=False, index=True)
    city = Column(String(200), nullable=False)
    country = Column(String(200), nullable=False)
    star_rating = Column(Integer, nullable=True)
    supplier_name = Column(String(200), nullable=True)
    supplier_contact = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room_categories = relationship("HotelRoomCategory", cascade="all, delete-orphan", lazy="joined")


class ActivityItem(Base):
    __tablename__ = "activity_items"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activity_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_name = Column(String(300), nullable=False)
    activity_type = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    selling_price_adult = Column(Float, nullable=True)
    selling_price_child = Column(Float, nullable=True)


class ActivityInventory(Base):
    __tablename__ = "activity_inventory"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    vendor_name = Column(String(300), nullable=False, index=True)
    city = Column(String(200), nullable=False)
    country = Column(String(200), nullable=False)
    supplier_name = Column(String(200), nullable=True)
    supplier_contact = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activity_items = relationship("ActivityItem", cascade="all, delete-orphan", lazy="joined")
