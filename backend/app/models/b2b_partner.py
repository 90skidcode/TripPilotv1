import enum
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class B2BCategory(str, enum.Enum):
    dmc = "dmc"
    hotel = "hotel"
    activity = "activity"
    transport = "transport"
    visa = "visa"
    flights = "flights"
    other = "other"


class B2BPartner(Base):
    __tablename__ = "b2b_partners"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    company_name = Column(String(300), nullable=False, index=True)
    contact_person = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    gst_number = Column(String(50), nullable=True)
    city = Column(String(200), nullable=True)
    country = Column(String(200), nullable=True, default="India")
    category = Column(Enum(B2BCategory), default=B2BCategory.dmc)
    commission_pct = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
