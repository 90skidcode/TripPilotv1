from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.followup import Followup
from app.models.itinerary import Itinerary
from app.models.tools import HotelVoucher, Invoice, FlightTicket
from app.models.message import Message
from app.models.activity import LeadActivity
from app.models.lead_costing import LeadCosting
from app.models.lead_partner import LeadPartner
from app.models.lead_payment import LeadPayment
from app.models.customer import Customer
from app.models.b2b_partner import B2BPartner
from app.models.inventory import HotelInventory, HotelRoomCategory, ActivityInventory, ActivityItem

router = APIRouter()


@router.delete("/org/clear-data", status_code=200)
def clear_org_transactional_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = current_user.org_id

    # 1. Delete all children of leads (they reference lead_id)
    lead_ids = [r[0] for r in db.query(Lead.id).filter(Lead.org_id == org_id).all()]
    if lead_ids:
        db.query(LeadCosting).filter(LeadCosting.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(Followup).filter(Followup.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(LeadActivity).filter(LeadActivity.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(LeadPayment).filter(LeadPayment.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(LeadPartner).filter(LeadPartner.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(Itinerary).filter(Itinerary.lead_id.in_(lead_ids)).delete(synchronize_session=False)

    # 2. Delete leads, itineraries, vouchers, invoices, flights, messages
    #    (all reference customers — must go before customers)
    db.query(Lead).filter(Lead.org_id == org_id).delete(synchronize_session=False)
    db.query(Itinerary).filter(Itinerary.org_id == org_id).delete(synchronize_session=False)
    db.query(HotelVoucher).filter(HotelVoucher.org_id == org_id).delete(synchronize_session=False)
    db.query(Invoice).filter(Invoice.org_id == org_id).delete(synchronize_session=False)
    db.query(FlightTicket).filter(FlightTicket.org_id == org_id).delete(synchronize_session=False)
    db.query(Message).filter(Message.org_id == org_id).delete(synchronize_session=False)

    # 3. Delete customers (now safe — nothing references them)
    db.query(Customer).filter(Customer.org_id == org_id).delete(synchronize_session=False)

    # 4. Delete B2B partners (lead_partners already deleted above)
    db.query(B2BPartner).filter(B2BPartner.org_id == org_id).delete(synchronize_session=False)

    # 5. Delete inventory — children first, then parents
    hotel_ids = [r[0] for r in db.query(HotelInventory.id).filter(HotelInventory.org_id == org_id).all()]
    if hotel_ids:
        db.query(HotelRoomCategory).filter(HotelRoomCategory.hotel_id.in_(hotel_ids)).delete(synchronize_session=False)
    db.query(HotelInventory).filter(HotelInventory.org_id == org_id).delete(synchronize_session=False)

    act_ids = [r[0] for r in db.query(ActivityInventory.id).filter(ActivityInventory.org_id == org_id).all()]
    if act_ids:
        db.query(ActivityItem).filter(ActivityItem.activity_id.in_(act_ids)).delete(synchronize_session=False)
    db.query(ActivityInventory).filter(ActivityInventory.org_id == org_id).delete(synchronize_session=False)

    db.commit()
    return {"cleared": True}
