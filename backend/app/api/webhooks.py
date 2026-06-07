from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.core.config import settings
from app.models.organization import Organization
from app.models.lead import Lead, LeadSource, LeadStage
from app.models.message import Message
from app.services.ai_service import generate_chat_reply
from app.services.meta_api import send_whatsapp_message, send_instagram_message

router = APIRouter()

@router.get("/meta")
def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    db: Session = Depends(get_db)
):
    """Verify webhook connection from Meta Developer portal."""
    if hub_mode == "subscribe" and hub_verify_token:
        # Check system default setting
        if settings.META_VERIFY_TOKEN and hub_verify_token == settings.META_VERIFY_TOKEN:
            print("[INFO] Meta Webhook verified using system fallback token.")
            return Response(content=hub_challenge, media_type="text/plain")
            
        # Check database organization tokens
        org = db.query(Organization).filter(Organization.meta_verify_token == hub_verify_token).first()
        if org:
            print(f"[INFO] Meta Webhook verified for Organization ID: {org.id}")
            return Response(content=hub_challenge, media_type="text/plain")

    print("[WARNING] Meta Webhook verification failed due to token mismatch.")
    raise HTTPException(status_code=403, detail="Verification token mismatch or invalid mode")


@router.post("/meta")
async def receive_meta_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive and route real-time messaging payloads from Meta (WhatsApp & Instagram)."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    print(f"[META WEBHOOK EVENT] Received payload: {json.dumps(payload, indent=2)}")

    obj_type = payload.get("object")

    # 1. HANDLE WHATSAPP CLOUD API PAYLOADS
    if obj_type == "whatsapp_business_account":
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if "messages" not in value:
                    continue

                metadata = value.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id")

                # Resolve Organization
                org = db.query(Organization).filter(Organization.whatsapp_phone_number_id == phone_number_id).first()
                if not org:
                    # Fallback to default organization
                    org = db.query(Organization).order_by(Organization.id).first()
                    if not org:
                        print("[ERROR] No organization found in database to map WhatsApp message.")
                        return Response(content="NO_ORG_CONFIGURED", status_code=200)

                for msg in value.get("messages", []):
                    # We only process incoming text messages
                    if msg.get("type") != "text" or "text" not in msg:
                        continue

                    message_id = msg.get("id")
                    sender_phone = msg.get("from")
                    message_text = msg.get("text", {}).get("body", "")

                    # Check for duplicate webhook events
                    existing_msg = db.query(Message).filter(Message.meta_message_id == message_id).first()
                    if existing_msg:
                        print(f"[INFO] Duplicate WhatsApp message ignored: {message_id}")
                        continue

                    # Extract sender profile name if available
                    contacts = value.get("contacts", [])
                    sender_name = "WhatsApp User"
                    if contacts:
                        sender_name = contacts[0].get("profile", {}).get("name", "WhatsApp User")

                    # Find or Create Lead
                    lead = db.query(Lead).filter(
                        Lead.org_id == org.id,
                        (Lead.whatsapp_number == sender_phone) | (Lead.phone == sender_phone)
                    ).first()

                    if not lead:
                        print(f"[INFO] Creating new WhatsApp lead for {sender_name} ({sender_phone})")
                        lead = Lead(
                            org_id=org.id,
                            name=sender_name,
                            phone=sender_phone,
                            whatsapp_number=sender_phone,
                            source=LeadSource.whatsapp,
                            stage=LeadStage.fresh,
                            notes=f"Auto-created from WhatsApp message: {message_text}"
                        )
                        db.add(lead)
                        db.commit()
                        db.refresh(lead)

                    # Save incoming message
                    new_msg = Message(
                        org_id=org.id,
                        lead_id=lead.id,
                        channel="whatsapp",
                        sender_type="customer",
                        sender_id=sender_phone,
                        message_text=message_text,
                        meta_message_id=message_id
                    )
                    db.add(new_msg)
                    db.commit()

                    # Trigger AI Autopilot if enabled
                    if org.autopilot_enabled:
                        print(f"[AUTOPILOT] Triggering AI auto-reply for WhatsApp Lead ID: {lead.id}")
                        # Fetch recent history
                        history_msgs = db.query(Message).filter(Message.lead_id == lead.id).order_by(Message.created_at.desc()).limit(8).all()
                        # Reverse list to get chronological order
                        history = [
                            {"sender_type": m.sender_type, "message_text": m.message_text}
                            for m in reversed(history_msgs)
                        ]
                        
                        ai_reply = await generate_chat_reply(lead.name, lead.notes, history, message_text)
                        
                        # Send to WhatsApp
                        try:
                            await send_whatsapp_message(
                                access_token=org.meta_access_token,
                                phone_number_id=org.whatsapp_phone_number_id,
                                recipient_phone=sender_phone,
                                text=ai_reply
                            )
                            # Save outbound message
                            outbound_msg = Message(
                                org_id=org.id,
                                lead_id=lead.id,
                                channel="whatsapp",
                                sender_type="ai",
                                sender_id=sender_phone,
                                message_text=ai_reply
                            )
                            db.add(outbound_msg)
                            db.commit()
                        except Exception as e:
                            print(f"[ERROR] Failed to send WhatsApp autopilot reply: {e}")

    # 2. HANDLE INSTAGRAM MESSENGER API PAYLOADS
    elif obj_type == "instagram":
        for entry in payload.get("entry", []):
            page_id = entry.get("id") # Instagram Page/Account ID

            # Resolve Organization
            org = db.query(Organization).filter(Organization.instagram_page_id == page_id).first()
            if not org:
                # Fallback to default organization
                org = db.query(Organization).order_by(Organization.id).first()
                if not org:
                    print("[ERROR] No organization found in database to map Instagram DM.")
                    return Response(content="NO_ORG_CONFIGURED", status_code=200)

            for event in entry.get("messaging", []):
                sender_id = event.get("sender", {}).get("id")
                recipient_id = event.get("recipient", {}).get("id")
                message_data = event.get("message", {})
                message_id = message_data.get("mid")
                message_text = message_data.get("text")

                # Verify this is a text message and not an echo or read receipt
                if not message_text or not message_id or message_data.get("is_echo"):
                    continue

                # Check for duplicate events
                existing_msg = db.query(Message).filter(Message.meta_message_id == message_id).first()
                if existing_msg:
                    print(f"[INFO] Duplicate Instagram message ignored: {message_id}")
                    continue

                # Find or Create Lead
                lead = db.query(Lead).filter(
                    Lead.org_id == org.id,
                    Lead.instagram_username == sender_id
                ).first()

                if not lead:
                    print(f"[INFO] Creating new Instagram lead for IGSID: {sender_id}")
                    lead = Lead(
                        org_id=org.id,
                        name=f"IG User {sender_id[:6]}",
                        phone="0000000000",
                        instagram_username=sender_id,
                        source=LeadSource.instagram,
                        stage=LeadStage.fresh,
                        notes=f"Auto-created from Instagram DM: {message_text}"
                    )
                    db.add(lead)
                    db.commit()
                    db.refresh(lead)

                # Save incoming message
                new_msg = Message(
                    org_id=org.id,
                    lead_id=lead.id,
                    channel="instagram",
                    sender_type="customer",
                    sender_id=sender_id,
                    message_text=message_text,
                    meta_message_id=message_id
                )
                db.add(new_msg)
                db.commit()

                # Trigger AI Autopilot if enabled
                if org.autopilot_enabled:
                    print(f"[AUTOPILOT] Triggering AI auto-reply for Instagram Lead ID: {lead.id}")
                    # Fetch recent history
                    history_msgs = db.query(Message).filter(Message.lead_id == lead.id).order_by(Message.created_at.desc()).limit(8).all()
                    history = [
                        {"sender_type": m.sender_type, "message_text": m.message_text}
                        for m in reversed(history_msgs)
                    ]
                    
                    ai_reply = await generate_chat_reply(lead.name, lead.notes, history, message_text)
                    
                    # Send to Instagram
                    try:
                        await send_instagram_message(
                            access_token=org.meta_access_token,
                            recipient_id=sender_id,
                            text=ai_reply
                        )
                        # Save outbound message
                        outbound_msg = Message(
                            org_id=org.id,
                            lead_id=lead.id,
                            channel="instagram",
                            sender_type="ai",
                            sender_id=sender_id,
                            message_text=ai_reply
                        )
                        db.add(outbound_msg)
                        db.commit()
                    except Exception as e:
                        print(f"[ERROR] Failed to send Instagram autopilot reply: {e}")

    return Response(content="EVENT_RECEIVED", status_code=200)
