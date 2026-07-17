"""add role back to users table

Revision ID: g0h1i2j3k4l5
Revises: f8g9h0i1j2k3
Create Date: 2026-07-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g0h1i2j3k4l5'
down_revision: Union[str, None] = 'f8g9h0i1j2k3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the role column back with default value
    op.add_column('users', sa.Column('role', sa.String(50), server_default='agent', nullable=False))


def downgrade() -> None:
    # Drop the role column if rolling back
    op.drop_column('users', 'role')
