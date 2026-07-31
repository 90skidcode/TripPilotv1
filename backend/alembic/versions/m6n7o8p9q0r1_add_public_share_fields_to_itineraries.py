"""add public share fields to itineraries

Revision ID: m6n7o8p9q0r1
Revises: l5m6n7o8p9q0
Create Date: 2026-07-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'm6n7o8p9q0r1'
down_revision: Union[str, None] = 'l5m6n7o8p9q0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    with op.batch_alter_table("itineraries") as batch_op:
        if "share_token" not in existing_cols:
            batch_op.add_column(sa.Column("share_token", sa.String(length=64), nullable=True))
            batch_op.create_index("ix_itineraries_share_token", ["share_token"], unique=True)
        if "is_public" not in existing_cols:
            batch_op.add_column(sa.Column("is_public", sa.Boolean(), server_default=sa.text("0"), nullable=False))
        if "share_enabled" not in existing_cols:
            batch_op.add_column(sa.Column("share_enabled", sa.Boolean(), server_default=sa.text("1"), nullable=False))
        if "share_expiry" not in existing_cols:
            batch_op.add_column(sa.Column("share_expiry", sa.DateTime(timezone=True), nullable=True))
        if "share_password" not in existing_cols:
            batch_op.add_column(sa.Column("share_password", sa.String(length=255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("itineraries")}

    with op.batch_alter_table("itineraries") as batch_op:
        if "share_password" in existing_cols:
            batch_op.drop_column("share_password")
        if "share_expiry" in existing_cols:
            batch_op.drop_column("share_expiry")
        if "share_enabled" in existing_cols:
            batch_op.drop_column("share_enabled")
        if "is_public" in existing_cols:
            batch_op.drop_column("is_public")
        if "share_token" in existing_cols:
            batch_op.drop_index("ix_itineraries_share_token")
            batch_op.drop_column("share_token")
