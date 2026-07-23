"""add start/end date, adults/children, cab type to itineraries

The itinerary builder's Overview tab already had inputs for Start Date, End
Date, Adults, Children and Cab Type, but the underlying columns never
existed on the itineraries table — the update payload was silently dropped
by the ItineraryCreate schema, so these fields never persisted.

Revision ID: l5m6n7o8p9q0
Revises: k4l5m6n7o8p9
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'l5m6n7o8p9q0'
down_revision: Union[str, None] = 'k4l5m6n7o8p9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    with op.batch_alter_table("itineraries") as batch_op:
        if "num_adults" not in existing_cols:
            batch_op.add_column(sa.Column("num_adults", sa.Integer(), nullable=True))
        if "num_children" not in existing_cols:
            batch_op.add_column(sa.Column("num_children", sa.Integer(), nullable=True))
        if "start_date" not in existing_cols:
            batch_op.add_column(sa.Column("start_date", sa.String(length=20), nullable=True))
        if "end_date" not in existing_cols:
            batch_op.add_column(sa.Column("end_date", sa.String(length=20), nullable=True))
        if "cab_type" not in existing_cols:
            batch_op.add_column(sa.Column("cab_type", sa.String(length=100), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    with op.batch_alter_table("itineraries") as batch_op:
        if "cab_type" in existing_cols:
            batch_op.drop_column("cab_type")
        if "end_date" in existing_cols:
            batch_op.drop_column("end_date")
        if "start_date" in existing_cols:
            batch_op.drop_column("start_date")
        if "num_children" in existing_cols:
            batch_op.drop_column("num_children")
        if "num_adults" in existing_cols:
            batch_op.drop_column("num_adults")
