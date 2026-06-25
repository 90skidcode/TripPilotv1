import enum
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PaymentType(str, enum.Enum):
    partial = "partial"
    full = "full"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    upi = "upi"
    cheque = "cheque"
    card = "card"
    other = "other"


class LeadPayment(Base):
    __tablename__ = "lead_payments"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.cash)
    payment_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", backref="payments")
