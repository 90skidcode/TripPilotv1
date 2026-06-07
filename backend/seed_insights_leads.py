import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.lead import Lead, LeadStage, LeadSource
from app.models.organization import Organization
from app.models.user import User

def seed_leads():
    db = SessionLocal()
    try:
        # Fetch first organization
        org = db.query(Organization).first()
        if not org:
            print("❌ No Organization found. Please register or seed the database first.")
            return

        # Fetch first user
        user = db.query(User).filter(User.org_id == org.id).first()
        user_id = user.id if user else None

        print(f"🌱 Seeding leads for Org ID: {org.id} ('{org.name}') and Agent User: {user.name if user else 'None'}")

        # List of interesting leads to seed
        leads_to_add = [
            {
                "name": "Deepika Padukone",
                "phone": "919876543210",
                "email": "deepika@example.com",
                "whatsapp_number": "919876543210",
                "source": LeadSource.whatsapp,
                "stage": LeadStage.fresh,
                "destination": "Maldives",
                "trip_type": "Honeymoon",
                "num_travellers": 2,
                "budget": "₹4,50,000",
                "notes": "Deepika is planning a premium 5-night honeymoon to the Maldives for late October. Specifically requested a sunset overwater villa with private pool at Soneva Jani or Waldorf Astoria. Prefers all-inclusive package with premium speedboat transfers."
            },
            {
                "name": "Amit Sharma",
                "phone": "918765432109",
                "email": "amit.sharma@example.com",
                "whatsapp_number": "918765432109",
                "source": LeadSource.instagram,
                "stage": LeadStage.qualified_hot,
                "destination": "Bali",
                "trip_type": "Family",
                "num_travellers": 4,
                "budget": "₹1,80,000",
                "notes": "Amit reached out via Instagram Direct. Planning an adventure-focused family trip to Bali for 7 nights. Needs active excursions (Ubud jungle swings, Mt. Batur sunrise trek, white-water rafting) and stay split between a private pool villa in Ubud and Seminyak resort."
            },
            {
                "name": "Rahul Varma",
                "phone": "919988776655",
                "email": "rahul.varma@example.com",
                "source": LeadSource.website,
                "stage": LeadStage.fresh,
                "destination": "Switzerland",
                "trip_type": "Corporate Leisure",
                "num_travellers": 2,
                "budget": "₹6,00,000",
                "notes": "Inquiry submitted through website portal. Seeking a scenic summer train journey across Switzerland (Zurich, Lucerne, Interlaken, and Zermatt). Demands 5-star hotels, first-class Swiss Travel Passes, and private airport transfers."
            },
            {
                "name": "Pranav Patel",
                "phone": "919090909090",
                "email": "pranav@example.com",
                "whatsapp_number": "919090909090",
                "source": LeadSource.whatsapp,
                "stage": LeadStage.qualified_warm,
                "destination": "Goa",
                "trip_type": "Friends Group",
                "num_travellers": 6,
                "budget": "₹65,000",
                "notes": "Pranav is organizing a 3-night reunion trip to North Goa with 5 friends. Looking for a budget-friendly private villa or service apartment near Calangute beach, and self-drive car rentals."
            }
        ]

        count = 0
        for l in leads_to_add:
            # Check if lead already exists by phone
            existing = db.query(Lead).filter(Lead.phone == l["phone"], Lead.org_id == org.id).first()
            if existing:
                print(f"⚠️ Lead with phone {l['phone']} already exists ({existing.name}). Skipping.")
                continue

            lead = Lead(
                org_id=org.id,
                name=l["name"],
                phone=l["phone"],
                email=l.get("email"),
                whatsapp_number=l.get("whatsapp_number"),
                source=l["source"],
                stage=l["stage"],
                destination=l.get("destination"),
                trip_type=l.get("trip_type"),
                num_travellers=l.get("num_travellers"),
                budget=l.get("budget"),
                notes=l.get("notes"),
                assigned_to=user_id,
                created_by=user_id
            )
            db.add(lead)
            count += 1

        db.commit()
        print(f"✨ Successfully seeded {count} new high-value CRM leads!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding leads: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_leads()
