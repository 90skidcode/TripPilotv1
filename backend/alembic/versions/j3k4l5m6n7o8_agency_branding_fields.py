"""add agency gstin + banking default fields

Organization.logo_url already existed but was only ever writable from the
superadmin side; this migration adds the fields the agency-facing Settings
page needs (GSTIN + banking defaults) so each agency can hold its own values
instead of sharing hardcoded frontend constants.

Revision ID: j3k4l5m6n7o8
Revises: i2j3k4l5m6n7
Create Date: 2026-07-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'j3k4l5m6n7o8'
down_revision: Union[str, None] = 'i2j3k4l5m6n7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_COLUMNS = [
    ("gstin", sa.String(length=20)),
    ("bank_holder_name", sa.String(length=200)),
    ("bank_account_number", sa.String(length=50)),
    ("bank_name", sa.String(length=200)),
    ("bank_ifsc", sa.String(length=20)),
]


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("organizations")}

    with op.batch_alter_table("organizations") as batch_op:
        for name, col_type in NEW_COLUMNS:
            if name not in existing_cols:
                batch_op.add_column(sa.Column(name, col_type, nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = {c["name"] for c in insp.get_columns("organizations")}

    with op.batch_alter_table("organizations") as batch_op:
        for name, _ in NEW_COLUMNS:
            if name in existing_cols:
                batch_op.drop_column(name)
