"""add advisor and agency settings to organizations

Revision ID: c6d7e8f9g0h1
Revises: e02b4e9c29a3
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6d7e8f9g0h1'
down_revision: Union[str, None] = 'e02b4e9c29a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS advisor_name VARCHAR(100)")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS advisor_phone VARCHAR(50)")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS advisor_email VARCHAR(255)")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS agency_name VARCHAR(300)")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS agency_office_address TEXT")
    op.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS agency_highlights JSON")


def downgrade() -> None:
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS advisor_name")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS advisor_phone")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS advisor_email")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS agency_name")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS agency_office_address")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS agency_highlights")
