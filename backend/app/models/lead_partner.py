from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeadPartner(Base):
    """Join between a lead and a B2B partner, allowing multiple partners per
    lead each with a role (DMC, hotel, transport, …) and negotiated cost."""

    __tablename__ = "lead_partners"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    b2b_partner_id = Column(Integer, ForeignKey("b2b_partners.id"), nullable=False, index=True)

    role = Column(String(100), nullable=True)   # e.g. DMC, Hotel, Transport, Visa
    cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    partner = relationship("B2BPartner")
