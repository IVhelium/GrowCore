"""add product attributes

Revision ID: d4a9f1b2c3e4
Revises: cbc586c639b9
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4a9f1b2c3e4"
down_revision: Union[str, Sequence[str], None] = "cbc586c639b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "attributes",
            sa.JSON(),
            server_default=sa.text("'{}'::json"),
            nullable=False,
        ),
    )
    op.alter_column("products", "attributes", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "attributes")
