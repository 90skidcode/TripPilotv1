"""add billing cycles table and subscription columns

Revision ID: e8f9g0h1i2j3
Revises: d7e8f9g0h1i2
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f9g0h1i2j3'
down_revision: Union[str, None] = 'd7e8f9g0h1i2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create plan_billing_cycles table if missing
    op.execute("""
        CREATE TABLE IF NOT EXISTS plan_billing_cycles (
            id SERIAL PRIMARY KEY,
            plan_id INTEGER NOT NULL REFERENCES pricing_plans(id),
            billing_cycle VARCHAR(20) NOT NULL,
            monthly_price FLOAT NOT NULL,
            discount_percent FLOAT DEFAULT 0,
            display_price VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    """)

    # Add new columns to subscriptions (safe for existing tables)
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_billing_cycle_id INTEGER REFERENCES plan_billing_cycles(id)")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20)")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMP DEFAULT now()")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMP")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()")
    op.execute("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()")

    # Add columns newer code expects on pricing_plans, in case the table predates them
    op.execute("ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0")
    op.execute("ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true")


def downgrade() -> None:
    op.execute("ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan_billing_cycle_id")
    op.execute("ALTER TABLE subscriptions DROP COLUMN IF EXISTS billing_cycle")
    op.execute("DROP TABLE IF EXISTS plan_billing_cycles")
