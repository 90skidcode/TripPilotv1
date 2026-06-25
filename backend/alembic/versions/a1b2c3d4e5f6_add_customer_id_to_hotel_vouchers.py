"""add customer_id to hotel_vouchers

Revision ID: a1b2c3d4e5f6
Revises: 082a062be3c7
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '082a062be3c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE hotel_vouchers ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)")


def downgrade() -> None:
    op.execute("ALTER TABLE hotel_vouchers DROP COLUMN IF EXISTS customer_id")
