"""add org_id to flights and partners

Revision ID: 082a062be3c7
Revises: e02b4e9c29a3
Create Date: 2026-06-08 21:24:26.473472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '082a062be3c7'
down_revision: Union[str, None] = 'e02b4e9c29a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE flight_tickets ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    op.execute("ALTER TABLE lead_partners ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    
    op.execute("UPDATE flight_tickets SET org_id=1 WHERE org_id IS NULL")
    op.execute("UPDATE lead_partners SET org_id=1 WHERE org_id IS NULL")


def downgrade() -> None:
    pass
