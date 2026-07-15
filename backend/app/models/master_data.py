from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.core.database import Base

class MasterData(Base):
    __tablename__ = "master_data"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)  # e.g., "payment_types", "payment_methods", "lead_stages", "room_types"
    key = Column(String(100), nullable=False)  # e.g., "full", "partial", "cash", "upi"
    label = Column(String(255), nullable=False)  # e.g., "Full Payment", "Partial Payment", "Cash", "UPI"
    description = Column(Text, nullable=True)  # Additional details
    order = Column(Integer, default=0)  # Sort order
    is_active = Column(Boolean, default=True)  # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # Index on category and is_active for quick lookups
        {"indexes": [
            {"columns": ["category", "is_active"]},
            {"columns": ["category", "key", "is_active"]},
        ]},
    )
