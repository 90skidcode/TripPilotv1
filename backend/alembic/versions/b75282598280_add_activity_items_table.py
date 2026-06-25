"""add activity_items table and vendor_name to activity_inventory

Revision ID: b75282598280
Revises: a9bd66cad5b2
Create Date: 2026-06-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'b75282598280'
down_revision = 'a9bd66cad5b2'
branch_labels = None
depends_on = None


def upgrade():
    # Add vendor_name column (will hold the old activity_name value)
    op.add_column('activity_inventory', sa.Column('vendor_name', sa.String(300), nullable=True))

    # Migrate old activity_name → vendor_name
    op.execute("UPDATE activity_inventory SET vendor_name = activity_name")

    # Make vendor_name non-nullable now that data is migrated
    op.alter_column('activity_inventory', 'vendor_name', nullable=False)

    # Create activity_items child table
    op.create_table(
        'activity_items',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('activity_id', sa.Integer(), sa.ForeignKey('activity_inventory.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('activity_name', sa.String(300), nullable=False),
        sa.Column('activity_type', sa.String(100), nullable=True),
        sa.Column('duration', sa.String(100), nullable=True),
        sa.Column('selling_price_adult', sa.Float(), nullable=True),
        sa.Column('selling_price_child', sa.Float(), nullable=True),
    )

    # Migrate existing activity data into the child table
    op.execute("""
        INSERT INTO activity_items (activity_id, activity_name, activity_type, duration, selling_price_adult, selling_price_child)
        SELECT id,
               COALESCE(activity_name, 'Activity'),
               activity_type,
               duration,
               selling_price_adult,
               selling_price_child
        FROM activity_inventory
        WHERE activity_name IS NOT NULL
           OR duration IS NOT NULL
           OR selling_price_adult IS NOT NULL
    """)


def downgrade():
    op.drop_table('activity_items')
    op.drop_column('activity_inventory', 'vendor_name')
