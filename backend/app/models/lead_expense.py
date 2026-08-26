import enum
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ExpenseCategory(str, enum.Enum):
    b2b_partner = "b2b_partner"
    visa = "visa"
    insurance = "insurance"
    flight = "flight"
    hotel = "hotel"
    activity = "activity"
    other = "other"


class ExpensePaymentStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"


class LeadExpense(Base):
    __tablename__ = "lead_expenses"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(Enum(ExpenseCategory), default=ExpenseCategory.other, nullable=False)
    title = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(Enum(ExpensePaymentStatus), default=ExpensePaymentStatus.paid, nullable=False)
    payment_method = Column(String(50), nullable=True, default="cash")
    payment_date = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", backref="expenses")
