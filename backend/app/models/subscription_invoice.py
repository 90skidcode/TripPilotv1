from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class SubscriptionInvoice(Base):
    """A payment request for one subscription period, paid offline.

    Renewal invoices are generated ahead of the renewal date; recording the
    payment advances the subscription period. Upgrade invoices carry the
    prorated charge when an admin upgrades a plan mid-period.
    """

    __tablename__ = "subscription_invoices"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True, index=True)

    invoice_type = Column(String(20), nullable=False, default="renewal")  # renewal | upgrade | manual
    plan_id = Column(Integer, nullable=True)
    plan_name = Column(String(50), nullable=True)  # snapshot
    billing_cycle = Column(String(20), nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)

    amount = Column(Float, nullable=False, default=0)  # INR, suggested; editable at payment time
    status = Column(String(20), nullable=False, default="due", index=True)  # due | paid | waived | void
    due_date = Column(DateTime, nullable=True)

    paid_at = Column(DateTime, nullable=True)
    payment_mode = Column(String(20), nullable=True)  # upi | bank_transfer | cash | cheque | other
    payment_reference = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    actor_id = Column(Integer, nullable=True)  # who recorded payment/waive
    actor_name = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
