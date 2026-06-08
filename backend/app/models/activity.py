from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeadActivity(Base):
    """Timeline of actions on a lead — both system-generated events
    (stage changes, itinerary/voucher/invoice created, follow-ups) and
    manually added notes/comments."""

    __tablename__ = "lead_activities"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = system

    type = Column(String(50), nullable=False)  # lead_created, stage_changed, itinerary_created, voucher_created, invoice_created, followup_scheduled, note
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    ref_type = Column(String(50), nullable=True)  # itinerary | voucher | invoice | followup | lead
    ref_id = Column(Integer, nullable=True)
    meta = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("User")
