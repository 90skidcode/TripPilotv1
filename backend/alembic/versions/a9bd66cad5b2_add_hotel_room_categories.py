"""add hotel_room_categories table

Revision ID: a9bd66cad5b2
Revises: d1a0b6751386
Create Date: 2026-06-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'a9bd66cad5b2'
down_revision = 'd1a0b6751386'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'hotel_room_categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotel_inventory.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('room_category_name', sa.String(200), nullable=False),
        sa.Column('meal_plan', sa.String(100), nullable=True),
        sa.Column('selling_price_weekday', sa.Float(), nullable=True),
        sa.Column('selling_price_weekend', sa.Float(), nullable=True),
    )

    # Migrate existing data: copy old single-category columns into the new child table
    op.execute("""
        INSERT INTO hotel_room_categories (hotel_id, room_category_name, meal_plan, selling_price_weekday, selling_price_weekend)
        SELECT id,
               COALESCE(room_category_name, 'Standard Room'),
               meal_plan,
               selling_price_weekday,
               selling_price_weekend
        FROM hotel_inventory
        WHERE room_category_name IS NOT NULL
           OR selling_price_weekday IS NOT NULL
           OR selling_price_weekend IS NOT NULL
    """)


def downgrade():
    op.drop_table('hotel_room_categories')
