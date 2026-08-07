from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.organization import Organization
from app.models.message import Message
from app.services.meta_api import send_whatsapp_message, send_instagram_message

router = APIRouter()

# --- Schemas ---

class MessageOut(BaseModel):
    id: int
    lead_id: Optional[int]
    channel: str
    sender_type: str
    sender_id: str
    message_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatThreadOut(BaseModel):
    id: int
    name: str
    identifier: str  # WhatsApp phone or Instagram username
    channel: str     # whatsapp or instagram
    last_message: str
    unread: bool
    avatar: str
    updated_at: datetime


class SendMessageInput(BaseModel):
    lead_id: int
    channel: str  # whatsapp or instagram
    message_text: str


class ToggleAutopilotInput(BaseModel):
    enabled: bool


class MetaConfigInput(BaseModel):
    meta_access_token: Optional[str] = None
    meta_verify_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    instagram_page_id: Optional[str] = None


class MetaConfigOut(BaseModel):
    meta_access_token: Optional[str]
    meta_verify_token: Optional[str]
    whatsapp_phone_number_id: Optional[str]
    instagram_page_id: Optional[str]
    autopilot_enabled: bool


# --- Routes ---

@router.get("/threads", response_model=List[ChatThreadOut])
def get_chat_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all active chat threads for the current organization."""
    # Find all leads in organization
    from sqlalchemy import or_
    leads = db.query(Lead).filter(Lead.org_id == current_user.org_id, or_(Lead.is_deleted == False, Lead.is_deleted == None)).all()
    lead_ids = [l.id for l in leads]

    if not lead_ids:
        return []

    # Get the latest message for each lead
    threads = []
    for lead in leads:
        last_msg = (
            db.query(Message)
            .filter(Message.lead_id == lead.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        if not last_msg:
            continue

        # Determine identifier based on channel
        channel = last_msg.channel
        identifier = lead.whatsapp_number if channel == "whatsapp" else lead.instagram_username
        if not identifier:
            identifier = lead.phone

        # Determine unread (if the last message was from the customer, mark it as unread/needs reply)
        unread = last_msg.sender_type == "customer"

        threads.append(ChatThreadOut(
            id=lead.id,
            name=lead.name,
            identifier=identifier or "Unknown Suffix",
            channel=channel,
            last_message=last_msg.message_text or "[Media/Non-text]",
            unread=unread,
            avatar="💬" if channel == "whatsapp" else "📸",
            updated_at=last_msg.created_at
        ))

    # Sort threads by updated_at descending
    threads.sort(key=lambda x: x.updated_at, reverse=True)
    return threads


@router.get("/history/{lead_id}", response_model=List[MessageOut])
def get_chat_history(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch the full chat history for a specific lead."""
    # Verify lead belongs to user organization
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    messages = (
        db.query(Message)
        .filter(Message.lead_id == lead_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages


@router.post("/send", response_model=MessageOut)
async def send_chat_message(
    payload: SendMessageInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an outbound WhatsApp or Instagram message and record it in database."""
    # Verify lead
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.org_id == current_user.org_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    channel = payload.channel.lower()
    recipient_id = ""

    # Call Meta Graph API
    if channel == "whatsapp":
        recipient_id = lead.whatsapp_number or lead.phone
        if not recipient_id:
            raise HTTPException(status_code=400, detail="Lead does not have a phone/WhatsApp number configured.")

        print(f"[CHAT SEND] Dispatching WhatsApp to {recipient_id}: {payload.message_text}")
        await send_whatsapp_message(
            access_token=org.meta_access_token,
            phone_number_id=org.whatsapp_phone_number_id,
            recipient_phone=recipient_id,
            text=payload.message_text
        )

    elif channel == "instagram":
        recipient_id = lead.instagram_username
        if not recipient_id:
            raise HTTPException(status_code=400, detail="Lead does not have an Instagram username/IGSID configured.")

        print(f"[CHAT SEND] Dispatching Instagram DM to {recipient_id}: {payload.message_text}")
        await send_instagram_message(
            access_token=org.meta_access_token,
            recipient_id=recipient_id,
            text=payload.message_text
        )

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported channel: {payload.channel}")

    # Save outgoing message
    new_msg = Message(
        org_id=org.id,
        lead_id=lead.id,
        channel=channel,
        sender_type="agent",
        sender_id=recipient_id,
        message_text=payload.message_text
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    return new_msg


@router.get("/config", response_model=MetaConfigOut)
def get_meta_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve Meta credentials and Autopilot configuration for current organization."""
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return MetaConfigOut(
        meta_access_token=org.meta_access_token,
        meta_verify_token=org.meta_verify_token,
        whatsapp_phone_number_id=org.whatsapp_phone_number_id,
        instagram_page_id=org.instagram_page_id,
        autopilot_enabled=org.autopilot_enabled
    )


@router.post("/config", response_model=MetaConfigOut)
def save_meta_config(
    payload: MetaConfigInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save Meta credentials for current organization."""
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.meta_access_token is not None:
        org.meta_access_token = payload.meta_access_token
    if payload.meta_verify_token is not None:
        org.meta_verify_token = payload.meta_verify_token
    if payload.whatsapp_phone_number_id is not None:
        org.whatsapp_phone_number_id = payload.whatsapp_phone_number_id
    if payload.instagram_page_id is not None:
        org.instagram_page_id = payload.instagram_page_id

    db.commit()
    db.refresh(org)
    
    return MetaConfigOut(
        meta_access_token=org.meta_access_token,
        meta_verify_token=org.meta_verify_token,
        whatsapp_phone_number_id=org.whatsapp_phone_number_id,
        instagram_page_id=org.instagram_page_id,
        autopilot_enabled=org.autopilot_enabled
    )


@router.post("/autopilot", response_model=MetaConfigOut)
def toggle_autopilot(
    payload: ToggleAutopilotInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle AI Autopilot reply state for organization."""
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.autopilot_enabled = payload.enabled
    db.commit()
    db.refresh(org)

    return MetaConfigOut(
        meta_access_token=org.meta_access_token,
        meta_verify_token=org.meta_verify_token,
        whatsapp_phone_number_id=org.whatsapp_phone_number_id,
        instagram_page_id=org.instagram_page_id,
        autopilot_enabled=org.autopilot_enabled
    )
