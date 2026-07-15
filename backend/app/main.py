from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import traceback

from app.core.database import SessionLocal
from app.core.security import hash_password
from fastapi.staticfiles import StaticFiles
from app.api import auth, leads, customers, itinerary, vouchers, invoices, inventory, dashboard, upload, followups, user_groups, superadmin, pricing, webhooks, chats, b2b_partners, lead_costing, flights, lead_partners, lead_payments, org_data, master_data
from app.models import organization, user, lead, customer as customer_model, itinerary as itinerary_model, followup, inventory as inventory_model, user_group, message as message_model
from app.models import b2b_partner as b2b_partner_model, lead_costing as lead_costing_model
from app.models.pricing_plan import PricingPlan
from app.models.master_data import MasterData


def seed_pricing_plans(db: Session):
    """Create default pricing plans if none exist."""
    plans = [
        {
            "name": "Free Trial",
            "monthly_price": 0,
            "itineraries_limit": 5,
            "leads_limit": 10,
            "vouchers_limit": 3,
            "bills_limit": 2,
            "team_members_limit": 1,
            "storage_gb": 1,
            "trial_days": 7,
        },
        {
            "name": "Starter",
            "monthly_price": 299,
            "itineraries_limit": 50,
            "leads_limit": 100,
            "vouchers_limit": 50,
            "bills_limit": 50,
            "team_members_limit": 5,
            "storage_gb": 5,
            "trial_days": 0,
        },
        {
            "name": "Pro",
            "monthly_price": 399,
            "itineraries_limit": 500,
            "leads_limit": 1000,
            "vouchers_limit": 500,
            "bills_limit": 500,
            "team_members_limit": 20,
            "storage_gb": 50,
            "trial_days": 0,
        },
        {
            "name": "Enterprise",
            "monthly_price": 0,  # Custom pricing
            "itineraries_limit": 999999,
            "leads_limit": 999999,
            "vouchers_limit": 999999,
            "bills_limit": 999999,
            "team_members_limit": 999999,
            "storage_gb": 1000,
            "trial_days": 0,
        },
    ]

    for plan_data in plans:
        existing = db.query(PricingPlan).filter(PricingPlan.name == plan_data["name"]).first()
        if not existing:
            plan = PricingPlan(**plan_data)
            db.add(plan)
            db.commit()
            print(f"[OK] Pricing plan created: {plan_data['name']}")
        else:
            print(f"[INFO] Pricing plan already exists: {plan_data['name']}")


def seed_admin(db: Session):
    """Create default organization and admin user if none exists."""
    from app.models.user import User
    from app.models.organization import Organization
    from app.models.pricing_plan import Subscription
    from datetime import datetime, timedelta

    # Create default organization
    existing_org = db.query(Organization).filter(Organization.slug == "default").first()
    if not existing_org:
        org = Organization(
            name="Default Organization",
            slug="default",
            plan="trial",
            is_active=True,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        print("[OK] Default organization created")
        org_id = org.id
    else:
        org_id = existing_org.id
        print("[INFO] Default organization already exists.")

    # Create default admin user
    existing = db.query(User).filter(User.email == "admin@trippilot.com").first()
    if not existing:
        admin = User(
            name="Admin",
            email="admin@trippilot.com",
            hashed_password=hash_password("password123"),
            org_id=org_id,
            role="admin",
            is_superadmin=True,
        )
        db.add(admin)
        db.commit()
        print("[OK] Default admin user created: admin@trippilot.com / password123")
    else:
        print("[INFO] Admin user already exists.")

    # Assign Free Trial plan to default organization
    existing_sub = db.query(Subscription).filter(Subscription.org_id == org_id).first()
    if not existing_sub:
        free_trial_plan = db.query(PricingPlan).filter(PricingPlan.name == "Free Trial").first()
        if free_trial_plan:
            subscription = Subscription(
                org_id=org_id,
                plan_id=free_trial_plan.id,
                status="active",
                start_date=datetime.utcnow(),
                trial_ends_at=datetime.utcnow() + timedelta(days=7),
            )
            db.add(subscription)
            db.commit()
            print("[OK] Free Trial subscription assigned to default organization")
        else:
            print("[WARNING] Free Trial plan not found, skipping subscription creation")
    else:
        print("[INFO] Subscription already exists for default organization")


def seed_master_data(db: Session):
    """Create default master data if none exist."""
    default_data = [
        # Lead Stages
        ("lead_stages", "fresh", "Fresh Lead", 1),
        ("lead_stages", "qualified_hot", "Qualified Hot", 2),
        ("lead_stages", "qualified_warm", "Qualified Warm", 3),
        ("lead_stages", "won", "Won", 4),
        ("lead_stages", "lost", "Lost", 5),
        ("lead_stages", "not_responding", "Not Responding", 6),
        ("lead_stages", "disqualified", "Disqualified", 7),
        ("lead_stages", "future_prospect", "Future Prospect", 8),

        # Lead Sources
        ("lead_sources", "website", "Website", 1),
        ("lead_sources", "phone", "Phone Call", 2),
        ("lead_sources", "email", "Email", 3),
        ("lead_sources", "social_media", "Social Media", 4),
        ("lead_sources", "whatsapp", "WhatsApp", 5),
        ("lead_sources", "referral", "Referral", 6),
        ("lead_sources", "walk_in", "Walk-in", 7),
        ("lead_sources", "event", "Event", 8),
        ("lead_sources", "other", "Other", 9),

        # Payment Types
        ("payment_types", "full", "Full Payment", 1),
        ("payment_types", "partial", "Partial Payment", 2),

        # Payment Methods
        ("payment_methods", "cash", "Cash", 1),
        ("payment_methods", "upi", "UPI", 2),
        ("payment_methods", "bank_transfer", "Bank Transfer", 3),
        ("payment_methods", "card", "Card", 4),
        ("payment_methods", "cheque", "Cheque", 5),
        ("payment_methods", "other", "Other", 6),
    ]

    for category, key, label, order in default_data:
        existing = db.query(MasterData).filter(
            MasterData.category == category,
            MasterData.key == key
        ).first()
        if not existing:
            data = MasterData(
                category=category,
                key=key,
                label=label,
                order=order,
            )
            db.add(data)

    db.commit()
    print("[OK] Master data seeded successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic (`alembic upgrade head` runs at container
    # start — see backend/Dockerfile). We intentionally do NOT call
    # Base.metadata.create_all here so migrations remain the single source of
    # truth and missing-migration bugs surface instead of being silently masked.
    db = SessionLocal()
    try:
        seed_pricing_plans(db)
        seed_admin(db)
        seed_master_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="TripPilot CRM API",
    description="Travel Agency CRM — Leads, Itineraries, Vouchers, Invoices",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — must be FIRST middleware so headers appear on ALL responses incl. 500s ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten to real domain in production
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── Global 500 handler — CORS headers are injected manually for safety ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(f"[500 ERROR] {request.method} {request.url}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# ── Routers ──
app.include_router(auth.router,        prefix="/auth",         tags=["Auth"])
app.include_router(master_data.router,  prefix="/master-data",  tags=["Master Data"])
app.include_router(pricing.router,     prefix="/pricing",      tags=["Pricing"])
app.include_router(user_groups.router, prefix="/user-groups",  tags=["User Groups"])
app.include_router(customers.router,   prefix="/customers",    tags=["Customers"])
app.include_router(leads.router,       prefix="/leads",        tags=["Leads"])
app.include_router(followups.router,                           tags=["Followups"])
app.include_router(itinerary.router,   prefix="/itinerary",    tags=["Itinerary"])
app.include_router(vouchers.router,    prefix="/vouchers",     tags=["Vouchers"])
app.include_router(flights.router,     prefix="/flights",      tags=["Flights"])
app.include_router(invoices.router,    prefix="/invoices",     tags=["Invoices"])
app.include_router(inventory.router,   prefix="/inventory",    tags=["Inventory"])
app.include_router(dashboard.router,   prefix="/dashboard",    tags=["Dashboard"])
app.include_router(upload.router,      prefix="/upload",       tags=["Upload"])
app.include_router(superadmin.router,  prefix="/superadmin",   tags=["SuperAdmin"])
app.include_router(webhooks.router,    prefix="/webhooks",     tags=["Webhooks"])
app.include_router(chats.router,       prefix="/chats",        tags=["Chats"])
app.include_router(b2b_partners.router, prefix="/b2b-partners", tags=["B2B Partners"])
app.include_router(lead_costing.router, prefix="/leads",        tags=["Lead Costing"])
app.include_router(lead_partners.router, prefix="/leads",       tags=["Lead Partners"])
app.include_router(lead_payments.router, prefix="/leads",       tags=["Lead Payments"])
app.include_router(org_data.router,                             tags=["Org Data"])

# ── Static Files ──
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "TripPilot CRM API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
