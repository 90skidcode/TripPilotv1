"""remove role column from users table

Revision ID: f8g9h0i1j2k3
Revises: e8f9g0h1i2j3
Create Date: 2026-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8g9h0i1j2k3'
down_revision: Union[str, None] = 'e8f9g0h1i2j3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the deprecated role column
    op.drop_column('users', 'role')


def downgrade() -> None:
    # Restore the role column if rolling back
    op.add_column('users', sa.Column('role', sa.String(50), server_default='agent', nullable=True))
