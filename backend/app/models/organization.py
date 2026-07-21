from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    phone_number = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    autopilot_enabled = Column(Boolean, default=False)

    # Meta (WhatsApp & Instagram) Live Integration Fields
    meta_access_token = Column(String(500), nullable=True)
    meta_verify_token = Column(String(200), nullable=True)
    whatsapp_phone_number_id = Column(String(100), nullable=True)
    instagram_page_id = Column(String(100), nullable=True)

    # Itinerary Advisor & Agency Settings (organization defaults)
    advisor_name = Column(String(100), nullable=True)
    advisor_phone = Column(String(50), nullable=True)
    advisor_email = Column(String(255), nullable=True)
    agency_name = Column(String(300), nullable=True)
    agency_office_address = Column(Text, nullable=True)
    agency_highlights = Column(JSON, nullable=True)  # [{icon, label}, ...]

    # Tax + banking defaults, used to prefill invoices/vouchers per agency
    gstin = Column(String(20), nullable=True)
    bank_holder_name = Column(String(200), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_name = Column(String(200), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
