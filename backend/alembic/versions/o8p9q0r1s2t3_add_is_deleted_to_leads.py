"""add is_deleted to leads for soft delete

Revision ID: o8p9q0r1s2t3
Revises: n7o8p9q0r1s2
Create Date: 2026-08-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'o8p9q0r1s2t3'
down_revision: Union[str, None] = 'n7o8p9q0r1s2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    try:
        op.add_column('leads', sa.Column('is_deleted', sa.Boolean(), server_default='0', nullable=False))
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_column('leads', 'is_deleted')
    except Exception:
        pass
