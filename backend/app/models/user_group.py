from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, func
from app.core.database import Base


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    permissions = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # permissions JSON structure:
    # {
    #   "leads":     {"read": true,  "write": true},
    #   "itinerary": {"read": true,  "write": false},
    #   "vouchers":  {"read": true,  "write": false},
    #   "inventory": {"read": false, "write": false},
    #   "dashboard": {"read": true,  "write": false},
    #   "settings":  {"read": false, "write": false},
    #   "users":     {"read": false, "write": false}
    # }
