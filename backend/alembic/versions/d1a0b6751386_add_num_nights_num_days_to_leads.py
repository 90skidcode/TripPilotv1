"""add num_nights num_days to leads

Revision ID: d1a0b6751386
Revises: c4d5e6f7a8b9
Create Date: 2026-06-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'd1a0b6751386'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('leads', sa.Column('num_nights', sa.Integer(), nullable=True))
    op.add_column('leads', sa.Column('num_days', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('leads', 'num_days')
    op.drop_column('leads', 'num_nights')
