from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.share_service import get_public_itinerary_data

router = APIRouter()


@router.get("/{share_token}")
def get_public_share_itinerary(share_token: str, db: Session = Depends(get_db)):
    """Public endpoint for retrieving itinerary data via secure share_token.
    Requires NO authentication session or JWT token.
    Enforces expiry and share_enabled status.
    Strips internal database IDs to preserve privacy.
    """
    return get_public_itinerary_data(db, share_token)
