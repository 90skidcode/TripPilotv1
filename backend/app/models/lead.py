import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeadSource(str, enum.Enum):
    whatsapp = "whatsapp"
    instagram = "instagram"
    website = "website"
    referral = "referral"
    advertisement = "advertisement"
    manual = "manual"
    email = "email"


class LeadStage(str, enum.Enum):
    fresh = "fresh"
    qualified_hot = "qualified_hot"
    qualified_warm = "qualified_warm"
    won = "won"
    lost = "lost"
    not_responding = "not_responding"
    disqualified = "disqualified"
    future_prospect = "future_prospect"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    source = Column(Enum(LeadSource), default=LeadSource.manual)
    stage = Column(Enum(LeadStage), default=LeadStage.fresh)
    destination = Column(String(200), nullable=True)
    trip_type = Column(String(100), nullable=True)
    travel_date = Column(DateTime(timezone=True), nullable=True)
    num_adults = Column(Integer, nullable=True)
    num_children = Column(Integer, nullable=True)
    num_infants = Column(Integer, nullable=True)
    num_nights = Column(Integer, nullable=True)
    num_days = Column(Integer, nullable=True)
    budget = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    b2b_partner_id = Column(Integer, ForeignKey("b2b_partners.id"), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, server_default="0", index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="leads")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    b2b_partner = relationship("B2BPartner")

    @property
    def adults(self):
        return self.num_adults

    @property
    def kids(self):
        return self.num_children

    @property
    def infants(self):
        return self.num_infants
