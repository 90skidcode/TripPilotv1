from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    layout = Column(String(50), default="visual_experience")
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Cover
    cover_image_url = Column(String(500), nullable=True)
    cover_title = Column(String(300), nullable=True)
    cover_subheading = Column(String(500), nullable=True)

    # Destination
    destination = Column(String(200), nullable=True)

    # Meta
    num_travellers = Column(Integer, nullable=True)
    num_adults = Column(Integer, nullable=True)
    num_children = Column(Integer, nullable=True)
    total_days = Column(Integer, nullable=True)
    total_nights = Column(Integer, nullable=True)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    cab_type = Column(String(100), nullable=True)

    # Pricing
    package_cost = Column(String(50), nullable=True)
    per_person_cost = Column(String(50), nullable=True)
    gst_percent = Column(Integer, default=5)
    payment_terms = Column(Text, nullable=True)
    inclusions = Column(Text, nullable=True)
    exclusions = Column(Text, nullable=True)

    # Complex structured data stored as JSON
    meals_summary = Column(JSON, nullable=True)    # {breakfast, lunch, dinner}
    ferry_blocks = Column(JSON, nullable=True)     # [{name, sector, date, time}]
    flights = Column(JSON, nullable=True)          # {onward: {...}, return: {...}}
    stay_options = Column(JSON, nullable=True)     # [{option, hotel_name, city, nights, ...}]
    days = Column(JSON, nullable=True)             # [{day, city, summary, activities, meals}]

    # Per-section show/hide toggles for the output (preview + PDF). A missing
    # key or null column means "visible" — see sectionVisible() on the frontend.
    section_visibility = Column(JSON, nullable=True)

    pdf_url = Column(String(500), nullable=True)
    share_url = Column(String(500), nullable=True)

    # Public Share Architecture
    share_token = Column(String(64), unique=True, index=True, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    share_enabled = Column(Boolean, default=True, nullable=False)
    share_expiry = Column(DateTime(timezone=True), nullable=True)
    share_password = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lead = relationship("Lead")
    creator = relationship("User")
