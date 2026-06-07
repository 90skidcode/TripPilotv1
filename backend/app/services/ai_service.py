"""
TripPilot AI Service — powered by Google Gemini
All AI calls go through this module.
"""
import json
import re
import httpx
from app.core.config import settings

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL = "gemini-2.5-flash"   # Using 2.5 flash as it might be more stable than flash-latest




async def _call_gemini(prompt: str, temperature: float = 0.3) -> str:
    """Raw Gemini API call with 3x retry mechanism and exponential backoff."""
    import asyncio
    url = f"{GEMINI_BASE}/{GEMINI_MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": settings.GEMINI_API_KEY,
    }
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 4096,
        },
    }
    
    last_err = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                resp = await client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except httpx.HTTPError as e:
            last_err = e
            print(f"Gemini API attempt {attempt + 1} failed: {e}. Retrying in {2 ** attempt}s...")
            await asyncio.sleep(2 ** attempt)
    raise last_err


def repair_truncated_json(s: str) -> str:
    """Zero-dependency robust utility to repair and close truncated JSON blocks."""
    s = s.strip()
    if not s:
        return "{}"
    s = re.sub(r"^```(?:json)?", "", s, flags=re.IGNORECASE).strip()
    s = re.sub(r"```$", "", s).strip()
    
    stack = []
    in_string = False
    escape = False
    repaired_chars = []
    
    for char in s:
        if escape:
            repaired_chars.append(char)
            escape = False
            continue
        if char == '\\' and in_string:
            repaired_chars.append(char)
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            repaired_chars.append(char)
            continue
        if in_string:
            repaired_chars.append(char)
            continue
        if char in ('{', '['):
            stack.append(char)
        elif char == '}':
            if stack and stack[-1] == '{':
                stack.pop()
        elif char == ']':
            if stack and stack[-1] == '[':
                stack.pop()
        repaired_chars.append(char)
        
    repaired = "".join(repaired_chars)
    if in_string:
        repaired += '"'
    while stack:
        top = stack.pop()
        if top == '{':
            repaired = repaired.rstrip(" \t\n\r,:")
            repaired += "}"
        elif top == '[':
            repaired = repaired.rstrip(" \t\n\r,")
            repaired += "]"
    return repaired


def _extract_json(text: str) -> dict | list:
    """Extract JSON block from Gemini response (handles markdown fences and truncation)."""
    text_clean = text.strip()
    # Try ```json ... ``` block first
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text_clean)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            try:
                return json.loads(repair_truncated_json(match.group(1).strip()))
            except Exception:
                pass
                
    # Fallback: try entire response as JSON
    try:
        return json.loads(text_clean)
    except json.JSONDecodeError:
        return json.loads(repair_truncated_json(text_clean))


# ─── Dynamic Unsplash Placeholder Sanitizer ───────────────────────────────────

def sanitize_itinerary_images(data: dict) -> dict:
    """Recursively replaces slow/broken loremflickr.com placeholder URLs with reliable Unsplash links."""
    if not isinstance(data, dict):
        return data
    
    def get_fallback_unsplash(url: str, seed: str = "") -> str:
        if not url or "loremflickr.com" not in url:
            return url
        
        lower = url.lower()
        
        # 1. Destination mappings
        if "bali" in lower:
            if any(k in lower for k in ["beach", "sunset", "jimbaran", "seminyak"]):
                return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
            if any(k in lower for k in ["rice", "tegalalang", "ubud", "forest", "swing"]):
                return "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80"
            return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
        
        if "singapore" in lower:
            return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80"
        if "malaysia" in lower or "kuala" in lower:
            return "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1200&q=80"
        if any(k in lower for k in ["manali", "mountain", "snow", "himalaya"]):
            return "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1200&q=80"
        if "goa" in lower:
            return "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=1200&q=80"
        if "kashmir" in lower:
            return "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?auto=format&fit=crop&w=1200&q=80"
        if "maldives" in lower:
            return "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80"
        if any(k in lower for k in ["paris", "europe", "london"]):
            return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
        
        # 2. Hotel mappings
        if any(k in lower for k in ["hotel", "resort", "stay", "villa"]):
            hotel_images = [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
            ]
            hash_val = sum(ord(c) for c in (seed or url))
            return hotel_images[hash_val % len(hotel_images)]
        
        # 3. Sightseeing mappings
        places_images = [
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80"
        ]
        hash_val = sum(ord(c) for c in (seed or url))
        return places_images[hash_val % len(places_images)]

    # Cover image URL
    if "cover_image_url" in data:
        data["cover_image_url"] = get_fallback_unsplash(data["cover_image_url"], data.get("title", ""))
    
    # Stay options hotel images
    if "stay_options" in data and isinstance(data["stay_options"], list):
        for s in data["stay_options"]:
            if isinstance(s, dict) and "image_url" in s:
                s["image_url"] = get_fallback_unsplash(s["image_url"], s.get("hotel_name", ""))
    
    # Day places images
    if "days" in data and isinstance(data["days"], list):
        for day in data["days"]:
            if isinstance(day, dict) and "places" in day and isinstance(day["places"], list):
                for p in day["places"]:
                    if isinstance(p, dict) and "image_url" in p:
                        p["image_url"] = get_fallback_unsplash(p["image_url"], p.get("name", ""))
                        
    return data


# ─── Lead Parsing ─────────────────────────────────────────────────────────────

async def parse_lead_from_text(raw_text: str) -> dict:
    """
    Parse a free-form WhatsApp/email message into a structured Lead dict.
    Returns keys: name, phone, email, destination, trip_type, num_travellers,
                  num_adults, num_children, num_infants, budget, travel_date, notes, source
    """
    prompt = f"""You are a travel CRM data extraction assistant.

Extract lead information from the following message and return a valid JSON object with these exact keys:
- name (string, required — first name + last name if available)
- phone (string, 9-13 digits, required — use "0000000000" if not found)
- email (string or null)
- destination (string or null — city/country they want to visit)
- trip_type (string or null — e.g. "Honeymoon", "Family", "Corporate", "Adventure")
- num_travellers (integer or null — total number of travellers)
- num_adults (integer or null — number of adults)
- num_children (integer or null — number of children)
- num_infants (integer or null — number of infants)
- budget (string or null — e.g. "₹50,000", "1 lakh")
- travel_date (string or null — ISO date YYYY-MM-DD if found, else null)
- notes (string — full original message as notes)
- source (one of: whatsapp, instagram, website, referral, advertisement, manual, email)

Message:
\"\"\"{raw_text}\"\"\"

Respond ONLY with a JSON object. No explanation."""

    try:
        text = await _call_gemini(prompt, temperature=0.1)
        return _extract_json(text)
    except Exception as e:
        print(f"Gemini Lead Parsing failed, executing rules-based fallback: {e}")
        # Rules-based regex parser fallback for extra resilience if Gemini is offline
        parsed = {
            "name": "Unknown",
            "phone": "0000000000",
            "email": None,
            "destination": None,
            "trip_type": None,
            "num_travellers": None,
            "num_adults": None,
            "num_children": None,
            "num_infants": None,
            "budget": None,
            "travel_date": None,
            "notes": raw_text,
            "source": "manual",
        }
        
        # 1. Try to extract phone (9 to 13 digits)
        phone_match = re.search(r'\b(?:\+?\d{1,3}[- ]?)?(\d{9,13})\b', raw_text)
        if phone_match:
            parsed["phone"] = phone_match.group(1)
            
        # 2. Try to extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', raw_text)
        if email_match:
            parsed["email"] = email_match.group(0)
            
        # 3. Try to extract a potential name
        words = raw_text.split()
        if words:
            first_word = words[0].strip(" ,.-!?")
            if first_word.lower() not in ["hi", "hello", "dear", "need", "want", "looking", "trip"]:
                parsed["name"] = first_word
            elif len(words) > 1:
                second_word = words[1].strip(" ,.-!?")
                if second_word.lower() not in ["need", "want", "looking", "trip"]:
                    parsed["name"] = second_word
                    
        # 4. Try to parse budget
        budget_match = re.search(r'\b(\d+(?:\s*(?:lakh|lakhs|lak|laks|k|thousand))|\d+,\d+(?:,\d+)?|\b\d+\s*(?:usd|sgd|inr|rs|rupees))\b', raw_text, re.IGNORECASE)
        if budget_match:
            parsed["budget"] = budget_match.group(1)
        elif "budget" in raw_text.lower():
            budget_near = re.search(r'budget\s*(?:of|is|:)?\s*([^,.\n]+)', raw_text, re.IGNORECASE)
            if budget_near:
                parsed["budget"] = budget_near.group(1).strip()
                
        # 5. Try to extract destinations
        destinations = ["paris", "maldives", "bali", "singapore", "goa", "manali", "kashmir", "europe", "switzerland", "london", "dubai", "thailand", "vietnam"]
        for d in destinations:
            if re.search(rf'\b{d}\b', raw_text, re.IGNORECASE):
                parsed["destination"] = d.capitalize()
                break
                
        # 6. Try to guess number of travellers
        adult_match = re.search(r'(\d+)\s*(?:adult|adults)', raw_text, re.IGNORECASE)
        kid_match = re.search(r'(\d+)\s*(?:kid|kids|child|children)', raw_text, re.IGNORECASE)
        infant_match = re.search(r'(\d+)\s*(?:infant|infants|baby|babies)', raw_text, re.IGNORECASE)
        
        num_travellers = 0
        if adult_match:
            parsed["num_adults"] = int(adult_match.group(1))
            num_travellers += parsed["num_adults"]
        if kid_match:
            parsed["num_children"] = int(kid_match.group(1))
            num_travellers += parsed["num_children"]
        if infant_match:
            parsed["num_infants"] = int(infant_match.group(1))
            num_travellers += parsed["num_infants"]
            
        if num_travellers > 0:
            parsed["num_travellers"] = num_travellers
            
        # 7. Try to guess trip type
        trip_types = ["honeymoon", "family", "corporate", "adventure", "friends", "solo"]
        for t in trip_types:
            if re.search(rf'\b{t}\b', raw_text, re.IGNORECASE):
                parsed["trip_type"] = t.capitalize()
                break
                
        return parsed


# ─── Itinerary Generation ─────────────────────────────────────────────────────

async def generate_itinerary(raw_text: str, layout: str = "visual_experience") -> dict:
    """
    Generate a fully structured itinerary JSON from raw text input.
    Returns a dict matching the Itinerary model schema.
    """
    prompt = f"""You are an expert travel itinerary planner for a travel agency CRM.

Generate a complete, detailed travel itinerary from the following description.
Return a valid JSON object with these exact keys:

{{
  "title": "Trip Title",
  "cover_image_url": "Image URL",
  "cover_title": "Cover Title",
  "cover_subheading": "Cover Subheading",
  "num_travellers": null,
  "total_days": 3,
  "total_nights": 2,
  "destination": "Primary Destination",
  "meals_summary": {{
    "breakfast": 0,
    "lunch": 0,
    "dinner": 0
  }},
  "flights": {{
    "onward": {{
      "from": "City",
      "to": "City",
      "airline": "Airline name or null",
      "date": "YYYY-MM-DD or null",
      "departure_time": "HH:MM or null",
      "arrival_time": "HH:MM or null",
      "duration": "Duration or null",
      "baggage": "Baggage or null"
    }},
    "return": {{
      "from": "City",
      "to": "City",
      "airline": "Airline name or null",
      "date": "YYYY-MM-DD or null",
      "departure_time": "HH:MM or null",
      "arrival_time": "HH:MM or null",
      "duration": "Duration or null",
      "baggage": "Baggage or null"
    }}
  }},
  "stay_options": [
    {{
      "option": "OPTION 1",
      "hotel_name": "Hotel Name",
      "image_url": "Hotel Image URL",
      "google_rating": "4.5",
      "directions_url": "Google Maps Link",
      "city": "City Name",
      "nights": 2,
      "room_category": "Room Category",
      "meal_plan": "Meal Plan"
    }}
  ],
  "days": [
    {{
      "day": 1,
      "city": "City Name",
      "summary": "Day Summary",
      "date": null,
      "places": [
        {{
          "name": "Sightseeing Place Name",
          "description": "Engaging description of sightseeing place.",
          "image_url": "Place Image URL"
        }}
      ],
      "activities": [
        "Minor activity or bullet point 1",
        "Minor activity or bullet point 2"
      ],
      "meals": {{
        "breakfast": true,
        "lunch": false,
        "dinner": true
      }},
      "tour_type": "SIC or Private"
    }}
  ]
}}

INSTRUCTIONS:
1. `cover_image_url`: You MUST generate a high-quality relevant placeholder image URL using Loremflickr, matching the destination. For example, if destination is Manali, use 'https://loremflickr.com/1200/800/manali,mountain'. If destination is Paris, use 'https://loremflickr.com/1200/800/paris,tower'.
2. For each hotel's `image_url` under `stay_options`: You MUST generate a high-quality relevant placeholder hotel image URL using Loremflickr. For example, use 'https://loremflickr.com/800/600/hotel,resort'.
3. For each sightseeing place's `image_url` under `places`: You MUST generate a high-quality placeholder image URL using Loremflickr matching the specific place name and destination keywords. For example, if the place is Hadimba Devi Temple, use 'https://loremflickr.com/800/600/hadimbatemple,manali'. If the place is Solang Valley, use 'https://loremflickr.com/800/600/solangvalley,manali'.
4. `places`: Inside each day, you MUST populate at least 2 or 3 sightseeing places under the `places` list. Each place must have a `name`, `description`, and `image_url`! Do NOT leave this empty. This is crucial for the visual experience layout!
5. `activities`: Keep this as a simple list of minor extra activities or notes for the day (e.g. transfer details, check-in, free evening).
6. `directions_url`: Always generate a valid Google Maps search URL for the hotel, like 'https://maps.google.com/?q=Hotel+Name+City'.
7. `google_rating`: Assign a realistic star rating like '4.2' or '4.5' based on the hotel's class.
8. `meal_plan`: Use standard travel meal plan terms (e.g. 'Breakfast Included', 'Breakfast & Dinner', 'Room Only').

9. CONCISENESS: All daily summaries, sightseeing descriptions, and cover descriptions MUST be extremely brief (max 15-20 words). Keep daily activities lists to a maximum of 3 short items. This is critical to prevent response truncation!

Trip description:
\"\"\"{raw_text}\"\"\"

Respond ONLY with a JSON object. No explanation."""

    try:
        text = await _call_gemini(prompt, temperature=0.6)
        data = _extract_json(text)
        # Compute total_days from days array if not provided
        if "days" in data and isinstance(data["days"], list):
            data["total_days"] = data.get("total_days") or len(data["days"])
            data["total_nights"] = data.get("total_nights") or max(0, len(data["days"]) - 1)
        return sanitize_itinerary_images(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("GEMINI ITINERARY GENERATION FAILED:", str(e))
        return {"title": "New Itinerary", "days": [], "total_days": 0, "total_nights": 0}


# ─── Hotel Voucher Parsing ────────────────────────────────────────────────────

async def parse_hotel_voucher(description: str) -> dict:
    """
    Parse a hotel booking description into a structured voucher dict.
    """
    prompt = f"""You are a hotel booking assistant for a travel agency.

Extract hotel booking details from the description below and return a valid JSON:
{{
  "hotel_name": "string",
  "hotel_stars": integer (1-5) or null,
  "hotel_address": "string or null",
  "check_in": "YYYY-MM-DD",
  "check_out": "YYYY-MM-DD",
  "room_type": "string or null",
  "num_rooms": integer or null,
  "num_guests": integer or null,
  "meal_plan": "string (e.g. Breakfast Included, All Inclusive) or null",
  "cancellation_policy": "string or null",
  "special_requests": "string or null"
}}

Booking description:
\"\"\"{description}\"\"\"

Respond ONLY with a JSON object."""

    try:
        text = await _call_gemini(prompt, temperature=0.1)
        return _extract_json(text)
    except Exception as e:
        print(f"Error in hotel voucher parsing: {e}")
        return {"hotel_name": "Unknown Hotel"}


# ─── Chat Edit ────────────────────────────────────────────────────────────────

async def edit_itinerary_with_chat(current_itinerary: dict, command: str) -> dict:
    """
    Apply a natural language edit command to an existing itinerary.
    e.g. "Add a cooking class on Day 2", "Change hotel on Day 3 to Hilton"
    """
    itin_json = json.dumps(current_itinerary, indent=2)
    prompt = f"""You are an itinerary editor assistant.

The user wants to modify the following travel itinerary:
```json
{itin_json}
```

Apply this edit command: "{command}"

Return the COMPLETE updated itinerary JSON with the same structure. Only change what the command requests.
Respond ONLY with the updated JSON object."""

    try:
        text = await _call_gemini(prompt, temperature=0.3)
        data = _extract_json(text)
        return sanitize_itinerary_images(data)
    except Exception as e:
        print(f"Error editing itinerary with chat: {e}")
        return current_itinerary  # Return unchanged on failure


async def generate_chat_reply(lead_name: str, lead_notes: str, chat_history: list, new_message: str) -> str:
    """Generate a contextual travel agent response using Gemini AI."""
    history_str = ""
    for msg in chat_history:
        sender = "Customer" if msg.get("sender_type") == "customer" else "Agent"
        text = msg.get("message_text") or ""
        history_str += f"{sender}: {text}\n"

    prompt = f"""You are an AI travel booking copilot for TripPilot CRM. 
You are conversing directly with a customer to help plan their trip.

Customer Name: {lead_name}
Context / CRM Notes about customer: {lead_notes or 'No notes recorded yet.'}

Recent Chat History:
{history_str}
Customer's New Message: "{new_message}"

Goal:
Generate a highly engaging, helpful, and friendly chat response. 
- Keep the response short (max 70 words) so it reads well on mobile chat.
- Ask target travel questions (e.g. destinations, dates, budgets, number of travellers) if they are missing from notes/history.
- Do NOT output JSON. Write the response as if you are texting them.

Response:"""
    try:
        reply = await _call_gemini(prompt, temperature=0.7)
        return reply.strip()
    except Exception as e:
        print(f"Error generating chat reply from Gemini: {e}")
        return "Thanks for reaching out! Let me check the best options for your vacation and get back to you shortly."


async def generate_dashboard_insights(leads_list: list) -> dict:
    """
    Generate dynamic travel CRM insights using Gemini AI, focusing on
    Predictive Lead Scoring & High-Value Alerts.
    """
    if not leads_list:
        # Fallback to realistic mock insights if no leads are present
        return {
            "insights": [
                {
                    "type": "high_value",
                    "title": "Welcome to TripPilot Co-Pilot",
                    "description": "Add your first leads via CSV import, manual entry, or WhatsApp/Instagram integration to unlock tailored AI sales insights.",
                    "badge": "Action Needed",
                    "badge_cls": "badge-teal",
                    "lead_id": None,
                    "action_type": "none",
                    "action_text": "",
                    "action_target": ""
                },
                {
                    "type": "score",
                    "title": "Predictive Scoring Ready",
                    "description": "Once leads are added, the AI will score their purchase intent and flag high-value bookings automatically.",
                    "badge": "AI Feature",
                    "badge_cls": "badge-blue",
                    "lead_id": None,
                    "action_type": "none",
                    "action_text": "",
                    "action_target": ""
                }
            ]
        }

    # Format leads concisely for Gemini
    leads_summary = []
    for l in leads_list[:15]:  # Limit to last 15 leads to prevent token overflow
        leads_summary.append({
            "id": l.get("id"),
            "name": l.get("name"),
            "source": str(l.get("source")),
            "stage": str(l.get("stage")),
            "destination": l.get("destination"),
            "trip_type": l.get("trip_type"),
            "budget": l.get("budget"),
            "phone": l.get("phone"),
            "notes": l.get("notes")[:150] if l.get("notes") else ""
        })

    leads_json = json.dumps(leads_summary, indent=2)

    prompt = f"""You are a travel agency sales co-pilot.
Analyze these recent leads to identify high-value opportunities and calculate predictive booking/intent scores.

Recent Leads:
{leads_json}

Task:
Generate exactly 2 to 3 highly specific, actionable insights. At least one must be a "high_value" alert and one a "score" alert.
Return a valid JSON object with a single key "insights" mapping to a list of insight objects.
Each object MUST have these exact fields:
- "type": either "high_value" (for high value/budget/destination targets) or "score" (for booking intent probability)
- "title": A short bold title (max 5-6 words, e.g. "High-Value Alert: [Name]" or "High Booking Intent: [Name]")
- "description": Highly specific, friendly, and actionable sales tip referencing the customer's name, destination, or request details (max 25 words).
- "badge": Short pill label (e.g. "90% Hot", "High Value", "Maldives Pitch", "Warm Lead")
- "badge_cls": One of: "badge-red", "badge-green", "badge-teal", "badge-orange", "badge-blue"
- "lead_id": The integer ID of the associated lead
- "action_type": "whatsapp" (if phone exists and they are active) or "view_lead" (to view detail) or "none"
- "action_text": Button text (e.g. "Chat on WhatsApp", "View Lead Details")
- "action_target": The target value for the action (e.g. phone number like "919876543210" for whatsapp, or the lead ID as string)

Example JSON Output:
{{
  "insights": [
    {{
      "type": "high_value",
      "title": "High-Value Alert: Deepika",
      "description": "Deepika is planning a premium Maldives honeymoon. Pitch our luxury overwater villa package today.",
      "badge": "High Value",
      "badge_cls": "badge-red",
      "lead_id": 12,
      "action_type": "whatsapp",
      "action_text": "Chat on WhatsApp",
      "action_target": "918888888888"
    }}
  ]
}}

Respond ONLY with a JSON object. No explanation."""

    try:
        text = await _call_gemini(prompt, temperature=0.4)
        result = _extract_json(text)
        if isinstance(result, dict) and "insights" in result:
            return result
    except Exception as e:
        print(f"Error generating dashboard insights: {e}")

    # Robust local rules-based fallback if Gemini fails or times out
    insights = []
    # Find highest budget or specific destinations
    for l in leads_list:
        dest = (l.get("destination") or "").lower()
        budget = (l.get("budget") or "").lower()
        if "maldives" in dest or "bali" in dest or "lakh" in budget or "₹1" in budget or "₹2" in budget:
            insights.append({
                "type": "high_value",
                "title": f"High-Value Alert: {l.get('name')}",
                "description": f"{l.get('name')} is inquiring about a high-budget trip to {l.get('destination') or 'their destination'}. Follow up immediately with a premium itinerary.",
                "badge": "High Value",
                "badge_cls": "badge-red",
                "lead_id": l.get("id"),
                "action_type": "whatsapp" if l.get("phone") and l.get("phone") != "0000000000" else "view_lead",
                "action_text": "Chat on WhatsApp" if l.get("phone") and l.get("phone") != "0000000000" else "View Lead",
                "action_target": l.get("phone") if l.get("phone") and l.get("phone") != "0000000000" else str(l.get("id"))
            })
            break

    # Add a predictive score based on stage
    for l in leads_list:
        if l.get("stage") in ["qualified_hot", "fresh"]:
            prob = "85% Hot" if l.get("stage") == "qualified_hot" else "65% Warm"
            insights.append({
                "type": "score",
                "title": f"Conversion Probability: {l.get('name')}",
                "description": f"Lead {l.get('name')} has active follow-up interest from {str(l.get('source')).upper()}. Booking intent is high.",
                "badge": prob,
                "badge_cls": "badge-green" if "Hot" in prob else "badge-orange",
                "lead_id": l.get("id"),
                "action_type": "view_lead",
                "action_text": "View Lead",
                "action_target": str(l.get("id"))
            })
            break

    if not insights:
        # Fallback if no matching rules trigger
        insights = [
            {
                "type": "high_value",
                "title": f"Lead Highlight: {leads_list[0].get('name')}",
                "description": f"Recent activity registered for {leads_list[0].get('name')} from {str(leads_list[0].get('source')).upper()}.",
                "badge": "Fresh Lead",
                "badge_cls": "badge-teal",
                "lead_id": leads_list[0].get("id"),
                "action_type": "view_lead",
                "action_text": "View Details",
                "action_target": str(leads_list[0].get("id"))
            }
        ]

    return {"insights": insights}
