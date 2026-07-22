"""add itinerary section_visibility field

Lets a user hide a whole itinerary section (Flights, Hotels, Pricing table,
Meals, Inclusions, Exclusions, Payment Policy, About Us) from the preview and
PDF even when it has data, independent of the existing "auto-hide when empty"
behavior.

Revision ID: k4l5m6n7o8p9
Revises: j3k4l5m6n7o8
Create Date: 2026-07-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'k4l5m6n7o8p9'
down_revision: Union[str, None] = 'j3k4l5m6n7o8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    if "section_visibility" not in existing_cols:
        with op.batch_alter_table("itineraries") as batch_op:
            batch_op.add_column(sa.Column("section_visibility", sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    if "section_visibility" in existing_cols:
        with op.batch_alter_table("itineraries") as batch_op:
            batch_op.drop_column("section_visibility")
