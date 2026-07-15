from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.core.database import Base

class MasterData(Base):
    __tablename__ = "master_data"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_category_is_active', 'category', 'is_active'),
        Index('idx_category_key_is_active', 'category', 'key', 'is_active'),
    )
