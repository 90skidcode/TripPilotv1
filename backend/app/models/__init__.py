# These imports register all SQLAlchemy models in metadata.
# Required for Alembic migrations and relationship resolution. noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.b2b_partner import B2BPartner  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.lead_costing import LeadCosting  # noqa: F401
from app.models.followup import Followup  # noqa: F401
from app.models.inventory import HotelInventory, HotelRoomCategory, ActivityInventory, ActivityItem  # noqa: F401
from app.models.itinerary import Itinerary  # noqa: F401
from app.models.user_group import UserGroup  # noqa: F401
from app.models.pricing_plan import PricingPlan, Subscription  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.tools import HotelVoucher, Invoice, FlightTicket  # noqa: F401
from app.models.activity import LeadActivity  # noqa: F401
from app.models.lead_partner import LeadPartner  # noqa: F401
from app.models.lead_payment import LeadPayment  # noqa: F401
