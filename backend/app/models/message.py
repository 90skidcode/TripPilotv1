from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(String(50), nullable=False, index=True)  # whatsapp, instagram
    sender_type = Column(String(50), nullable=False)          # customer, agent, ai
    sender_id = Column(String(100), nullable=False)            # phone number or instagram user ID
    message_text = Column(Text, nullable=True)
    meta_message_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization")
    lead = relationship("Lead")
