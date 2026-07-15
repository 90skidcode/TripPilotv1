"""create master_data table

Revision ID: d7e8f9g0h1i2
Revises: c6d7e8f9g0h1
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9g0h1i2'
down_revision: Union[str, None] = 'c6d7e8f9g0h1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'master_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_category_is_active', 'master_data', ['category', 'is_active'], unique=False)
    op.create_index('idx_category_key_is_active', 'master_data', ['category', 'key', 'is_active'], unique=False)
    op.create_index('ix_master_data_category', 'master_data', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_master_data_category', table_name='master_data')
    op.drop_index('idx_category_key_is_active', table_name='master_data')
    op.drop_index('idx_category_is_active', table_name='master_data')
    op.drop_table('master_data')
