import secrets
import string
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.itinerary import Itinerary
from app.models.organization import Organization
from app.models.user import User


def generate_share_token(length: int = 16) -> str:
    """Generate a secure, random, URL-safe uppercase/digit token.
    Example: 4YH8KJ2MPQ9XW7AZ
    """
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def ensure_share_token(db: Session, itin: Itinerary) -> str:
    """Ensure an itinerary has a unique share_token. If missing, generate and persist one."""
    if not itin.share_token:
        token = generate_share_token(16)
        while db.query(Itinerary).filter(Itinerary.share_token == token).first():
            token = generate_share_token(16)
        itin.share_token = token
        if itin.share_enabled is None:
            itin.share_enabled = True
        db.commit()
        db.refresh(itin)
    return itin.share_token


def get_public_itinerary_data(db: Session, share_token: str) -> dict:
    """Retrieve itinerary data for public viewing by share_token.
    Enforces security:
    1. Returns 404 if not found or share_enabled is False.
    2. Returns 410 if link has expired.
    3. Strips all internal database IDs (id, org_id, created_by, lead_id).
    """
    if not share_token or not share_token.strip():
        raise HTTPException(status_code=404, detail="Invalid share token")

    itin = db.query(Itinerary).filter(Itinerary.share_token == share_token.strip()).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found or link is invalid")

    # Check enabled state
    if not itin.share_enabled:
        raise HTTPException(status_code=404, detail="Sharing for this itinerary has been disabled by the owner")

    # Check expiry date
    if itin.share_expiry:
        now = datetime.now(timezone.utc)
        expiry = itin.share_expiry if itin.share_expiry.tzinfo else itin.share_expiry.replace(tzinfo=timezone.utc)
        if now > expiry:
            raise HTTPException(status_code=410, detail="This itinerary link has expired")

    # Fetch agency & advisor branding without exposing sensitive user/org data
    org = db.query(Organization).filter(Organization.id == itin.org_id).first() if itin.org_id else None
    creator = db.query(User).filter(User.id == itin.created_by).first() if itin.created_by else None

    raw_agency_name = (creator and getattr(creator, "agency_name", None)) or (org and getattr(org, "name", None)) or ""
    agency_name = raw_agency_name.strip() if raw_agency_name and raw_agency_name.strip().lower() != "trippilot" else ""

    logo_url = (creator and getattr(creator, "logo_url", None)) or (org and getattr(org, "logo_url", None)) or ""
    office_address = (creator and getattr(creator, "agency_office_address", None)) or (org and getattr(org, "office_address", None)) or ""

    advisor_name = (creator and getattr(creator, "name", None)) or ""
    advisor_email = (creator and getattr(creator, "email", None)) or ""
    advisor_phone = (creator and getattr(creator, "phone", None)) or ""

    # Build public payload strictly excluding internal IDs
    return {
        "title": itin.title,
        "layout": itin.layout or "dark_template",
        "cover_image_url": itin.cover_image_url,
        "cover_title": itin.cover_title,
        "cover_subheading": itin.cover_subheading,
        "destination": itin.destination,
        "num_travellers": itin.num_travellers,
        "num_adults": itin.num_adults,
        "num_children": itin.num_children,
        "total_days": itin.total_days,
        "total_nights": itin.total_nights,
        "start_date": itin.start_date,
        "end_date": itin.end_date,
        "cab_type": itin.cab_type,
        "package_cost": itin.package_cost,
        "per_person_cost": itin.per_person_cost,
        "gst_percent": itin.gst_percent,
        "payment_terms": itin.payment_terms,
        "inclusions": itin.inclusions,
        "exclusions": itin.exclusions,
        "meals_summary": itin.meals_summary,
        "ferry_blocks": itin.ferry_blocks,
        "flights": itin.flights,
        "stay_options": itin.stay_options,
        "days": itin.days,
        "section_visibility": itin.section_visibility,
        "share_token": itin.share_token,
        "agency": {
            "name": agency_name,
            "logo_url": logo_url,
            "office_address": office_address,
        },
        "advisor": {
            "name": advisor_name,
            "email": advisor_email,
            "phone": advisor_phone,
        },
    }
