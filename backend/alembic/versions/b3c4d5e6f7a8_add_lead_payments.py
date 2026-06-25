"""add lead_payments

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-25 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lead_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.Integer(), nullable=False),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('payment_type', sa.Enum('partial', 'full', name='paymenttype'), nullable=False),
        sa.Column('payment_method', sa.Enum('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other', name='paymentmethod'), nullable=True),
        sa.Column('payment_date', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_lead_payments_id'), 'lead_payments', ['id'], unique=False)
    op.create_index(op.f('ix_lead_payments_lead_id'), 'lead_payments', ['lead_id'], unique=False)
    op.create_index(op.f('ix_lead_payments_org_id'), 'lead_payments', ['org_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_lead_payments_org_id'), table_name='lead_payments')
    op.drop_index(op.f('ix_lead_payments_lead_id'), table_name='lead_payments')
    op.drop_index(op.f('ix_lead_payments_id'), table_name='lead_payments')
    op.drop_table('lead_payments')
    op.execute("DROP TYPE IF EXISTS paymenttype")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
