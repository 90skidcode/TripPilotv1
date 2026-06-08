from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class HotelVoucher(Base):
    __tablename__ = "hotel_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    hotel_name = Column(String(300), nullable=False)
    hotel_stars = Column(Integer, nullable=True)
    hotel_address = Column(Text, nullable=True)
    banner_image_url = Column(String(500), nullable=True)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    room_type = Column(String(200), nullable=True)
    num_rooms = Column(Integer, nullable=True)
    num_guests = Column(Integer, nullable=True)
    meal_plan = Column(String(100), nullable=True)
    cancellation_policy = Column(Text, nullable=True)
    special_requests = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)

    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead")
    customer = relationship("Customer")
    creator = relationship("User")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Agency
    agency_name = Column(String(300), nullable=True)
    agency_address = Column(Text, nullable=True)
    agency_gst = Column(String(50), nullable=True)

    # Customer
    customer_name = Column(String(200), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_address = Column(Text, nullable=True)
    customer_gst = Column(String(50), nullable=True)
    booking_type = Column(String(100), nullable=True)

    # Financial
    line_items = Column(JSON, nullable=True)
    subtotal = Column(String(50), nullable=True)
    advance_payment = Column(String(50), nullable=True)
    total_gst = Column(String(50), nullable=True)
    grand_total = Column(String(50), nullable=True)
    tax_basis = Column(String(50), default="on_selling_price")

    # Payment
    payment_terms = Column(Text, nullable=True)
    bank_holder = Column(String(200), nullable=True)
    bank_account = Column(String(50), nullable=True)
    bank_name = Column(String(200), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)

    pdf_url = Column(String(500), nullable=True)
    status = Column(String(50), default="draft")  # draft, sent, paid, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lead = relationship("Lead")
    creator = relationship("User")


class FlightTicket(Base):
    __tablename__ = "flight_tickets"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    airline = Column(String(200), nullable=False)
    flight_number = Column(String(50), nullable=True)
    pnr = Column(String(50), nullable=True)
    cabin_class = Column(String(50), nullable=True)
    origin = Column(String(150), nullable=True)        # From (airport / city)
    destination = Column(String(150), nullable=True)   # To (airport / city)
    depart_at = Column(DateTime(timezone=True), nullable=True)
    arrive_at = Column(DateTime(timezone=True), nullable=True)
    num_passengers = Column(Integer, nullable=True)
    passengers = Column(JSON, nullable=True)           # [{name, type, seat, ticket_no}]
    fare = Column(String(50), nullable=True)
    baggage = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)

    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead")
    customer = relationship("Customer")
    creator = relationship("User")
