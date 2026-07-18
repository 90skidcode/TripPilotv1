"""modern subscription lifecycle

- subscription_invoices table (offline renewal/upgrade invoices)
- subscriptions.pending_plan_id (scheduled downgrades)
- status backfill: rows with a future/past trial become 'trialing'
- dedupe subscriptions to one per org + unique index
- drop dead usage_tracking table
- drop denormalized organizations.plan column
- deactivate the legacy 'Free Trial' pseudo-plan (trials are now a
  subscription state, not a plan)

Revision ID: i2j3k4l5m6n7
Revises: h1i2j3k4l5m6
Create Date: 2026-07-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i2j3k4l5m6n7'
down_revision: Union[str, None] = 'h1i2j3k4l5m6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = insp.get_table_names()

    # 1. subscription_invoices table
    if "subscription_invoices" not in tables:
        op.create_table(
            'subscription_invoices',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('org_id', sa.Integer(), nullable=False),
            sa.Column('subscription_id', sa.Integer(), nullable=True),
            sa.Column('invoice_type', sa.String(length=20), nullable=False, server_default='renewal'),
            sa.Column('plan_id', sa.Integer(), nullable=True),
            sa.Column('plan_name', sa.String(length=50), nullable=True),
            sa.Column('billing_cycle', sa.String(length=20), nullable=True),
            sa.Column('period_start', sa.DateTime(), nullable=True),
            sa.Column('period_end', sa.DateTime(), nullable=True),
            sa.Column('amount', sa.Float(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='due'),
            sa.Column('due_date', sa.DateTime(), nullable=True),
            sa.Column('paid_at', sa.DateTime(), nullable=True),
            sa.Column('payment_mode', sa.String(length=20), nullable=True),
            sa.Column('payment_reference', sa.String(length=100), nullable=True),
            sa.Column('note', sa.Text(), nullable=True),
            sa.Column('actor_id', sa.Integer(), nullable=True),
            sa.Column('actor_name', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_subscription_invoices_id'), 'subscription_invoices', ['id'], unique=False)
        op.create_index(op.f('ix_subscription_invoices_org_id'), 'subscription_invoices', ['org_id'], unique=False)
        op.create_index(op.f('ix_subscription_invoices_subscription_id'), 'subscription_invoices', ['subscription_id'], unique=False)
        op.create_index(op.f('ix_subscription_invoices_status'), 'subscription_invoices', ['status'], unique=False)
        op.create_index(op.f('ix_subscription_invoices_created_at'), 'subscription_invoices', ['created_at'], unique=False)

    # 2. subscriptions.pending_plan_id
    sub_cols = [c['name'] for c in insp.get_columns('subscriptions')]
    if 'pending_plan_id' not in sub_cols:
        op.add_column('subscriptions', sa.Column('pending_plan_id', sa.Integer(), nullable=True))

    # 3. Status backfill: subscriptions still inside a trial become 'trialing'
    op.execute(
        "UPDATE subscriptions SET status = 'trialing' "
        "WHERE trial_ends_at IS NOT NULL AND status IN ('active', 'trial')"
    )
    # Any legacy derived 'trial' rows without trial_ends_at just become active
    op.execute("UPDATE subscriptions SET status = 'active' WHERE status = 'trial'")

    # 4. Dedupe: keep only the newest subscription per org, then enforce uniqueness
    op.execute(
        "DELETE FROM subscriptions WHERE id NOT IN "
        "(SELECT max_id FROM (SELECT MAX(id) AS max_id FROM subscriptions GROUP BY org_id) AS keep)"
    )
    sub_indexes = [i['name'] for i in insp.get_indexes('subscriptions')]
    if 'ix_subscriptions_org_id' not in sub_indexes:
        op.create_index('ix_subscriptions_org_id', 'subscriptions', ['org_id'], unique=True)

    # 5. Drop dead usage_tracking table
    if 'usage_tracking' in tables:
        op.drop_table('usage_tracking')

    # 6. Drop denormalized organizations.plan (plan now derived from subscription)
    org_cols = [c['name'] for c in insp.get_columns('organizations')]
    if 'plan' in org_cols:
        with op.batch_alter_table('organizations') as batch_op:
            batch_op.drop_column('plan')

    # 7. Trials are a subscription state now — retire the pseudo-plan
    op.execute("UPDATE pricing_plans SET is_active = false WHERE trial_days > 0")


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    org_cols = [c['name'] for c in insp.get_columns('organizations')]
    if 'plan' not in org_cols:
        with op.batch_alter_table('organizations') as batch_op:
            batch_op.add_column(sa.Column('plan', sa.String(length=50), nullable=True))

    sub_indexes = [i['name'] for i in insp.get_indexes('subscriptions')]
    if 'ix_subscriptions_org_id' in sub_indexes:
        op.drop_index('ix_subscriptions_org_id', table_name='subscriptions')

    sub_cols = [c['name'] for c in insp.get_columns('subscriptions')]
    if 'pending_plan_id' in sub_cols:
        with op.batch_alter_table('subscriptions') as batch_op:
            batch_op.drop_column('pending_plan_id')

    op.execute("UPDATE subscriptions SET status = 'active' WHERE status IN ('trialing', 'past_due')")

    if 'subscription_invoices' in insp.get_table_names():
        op.drop_table('subscription_invoices')
    # usage_tracking is not restored — it was dead code with no readers
