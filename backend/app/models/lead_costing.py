from sqlalchemy import Column, Integer, Float, String, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeadCosting(Base):
    __tablename__ = "lead_costings"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, unique=True, index=True)
    b2b_cost = Column(Float, nullable=True, default=0)
    customer_price = Column(Float, nullable=True, default=0)
    currency = Column(String(10), default="INR")
    cost_breakdown = Column(JSON, nullable=True)  # Optional line items
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lead = relationship("Lead", backref="costing")
