"""add subscription_history

Revision ID: h1i2j3k4l5m6
Revises: g0h1i2j3k4l5
Create Date: 2026-07-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'h1i2j3k4l5m6'
down_revision: Union[str, None] = 'g0h1i2j3k4l5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if "subscription_history" in insp.get_table_names():
        return

    op.create_table(
        'subscription_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=30), nullable=False),
        sa.Column('old_plan_id', sa.Integer(), nullable=True),
        sa.Column('new_plan_id', sa.Integer(), nullable=True),
        sa.Column('plan_name', sa.String(length=50), nullable=True),
        sa.Column('billing_cycle', sa.String(length=20), nullable=True),
        sa.Column('old_renewal_date', sa.DateTime(), nullable=True),
        sa.Column('new_renewal_date', sa.DateTime(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('payment_mode', sa.String(length=20), nullable=True),
        sa.Column('payment_reference', sa.String(length=100), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('actor_name', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_subscription_history_id'), 'subscription_history', ['id'], unique=False)
    op.create_index(op.f('ix_subscription_history_org_id'), 'subscription_history', ['org_id'], unique=False)
    op.create_index(op.f('ix_subscription_history_subscription_id'), 'subscription_history', ['subscription_id'], unique=False)
    op.create_index(op.f('ix_subscription_history_created_at'), 'subscription_history', ['created_at'], unique=False)


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if "subscription_history" not in insp.get_table_names():
        return
    op.drop_index(op.f('ix_subscription_history_created_at'), table_name='subscription_history')
    op.drop_index(op.f('ix_subscription_history_subscription_id'), table_name='subscription_history')
    op.drop_index(op.f('ix_subscription_history_org_id'), table_name='subscription_history')
    op.drop_index(op.f('ix_subscription_history_id'), table_name='subscription_history')
    op.drop_table('subscription_history')
