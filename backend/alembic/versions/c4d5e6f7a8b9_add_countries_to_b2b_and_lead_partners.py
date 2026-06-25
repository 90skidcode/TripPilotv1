"""add countries to b2b_partners and country to lead_partners

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-06-25 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('b2b_partners', sa.Column('countries', sa.JSON(), nullable=True))
    op.add_column('lead_partners', sa.Column('country', sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column('lead_partners', 'country')
    op.drop_column('b2b_partners', 'countries')
