"""add guest_name to hotel_vouchers and website to organizations

Revision ID: n7o8p9q0r1s2
Revises: m6n7o8p9q0r1
Create Date: 2026-07-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'n7o8p9q0r1s2'
down_revision: Union[str, None] = 'm6n7o8p9q0r1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE hotel_vouchers ADD COLUMN IF NOT EXISTS guest_name VARCHAR(250)")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255)")


def downgrade() -> None:
    op.execute("ALTER TABLE hotel_vouchers DROP COLUMN IF EXISTS guest_name")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS website")
