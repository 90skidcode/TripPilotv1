import httpx
from app.core.config import settings

async def send_whatsapp_message(access_token: str, phone_number_id: str, recipient_phone: str, text: str) -> dict:
    """Send an outbound WhatsApp message using Meta's WhatsApp Cloud API."""
    token = access_token or settings.META_ACCESS_TOKEN
    phone_id = phone_number_id or settings.WHATSAPP_PHONE_NUMBER_ID
    
    if not token or not phone_id:
        print("[WARNING] Meta token or Phone Number ID not configured. Skipping WhatsApp send.")
        return {"status": "skipped", "reason": "unconfigured"}
        
    url = f"https://graph.facebook.com/{settings.META_API_VERSION}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_phone,
        "type": "text",
        "text": {
            "body": text
        }
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload, timeout=20)
        resp.raise_for_status()
        return resp.json()


async def send_instagram_message(access_token: str, recipient_id: str, text: str) -> dict:
    """Send an outbound Instagram DM using Meta's Messenger API for Instagram."""
    token = access_token or settings.META_ACCESS_TOKEN
    
    if not token:
        print("[WARNING] Meta access token not configured. Skipping Instagram send.")
        return {"status": "skipped", "reason": "unconfigured"}
        
    url = f"https://graph.facebook.com/{settings.META_API_VERSION}/me/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "recipient": {
            "id": recipient_id
        },
        "message": {
            "text": text
        }
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload, timeout=20)
        resp.raise_for_status()
        return resp.json()
