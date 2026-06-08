"""fix missing org_id in hotel_vouchers

Revision ID: e02b4e9c29a3
Revises: fbd848f261ad
Create Date: 2026-06-08 20:30:45.184907

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e02b4e9c29a3'
down_revision: Union[str, None] = 'fbd848f261ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely add org_id to tables that might have been created before the organization updates
    op.execute("ALTER TABLE hotel_vouchers ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    op.execute("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    op.execute("ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    op.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)")
    
    # Update existing rows to have org_id=1 as a fallback before we can make it NOT NULL (if needed)
    op.execute("UPDATE hotel_vouchers SET org_id=1 WHERE org_id IS NULL")
    op.execute("UPDATE invoices SET org_id=1 WHERE org_id IS NULL")
    op.execute("UPDATE itineraries SET org_id=1 WHERE org_id IS NULL")
    op.execute("UPDATE messages SET org_id=1 WHERE org_id IS NULL")


def downgrade() -> None:
    pass
