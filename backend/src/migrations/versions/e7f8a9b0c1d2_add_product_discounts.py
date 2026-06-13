"""add product discounts

Revision ID: e7f8a9b0c1d2
Revises: 3d4e5f6a7b8c
Create Date: 2026-06-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "3d4e5f6a7b8c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "discount_percent",
            sa.Numeric(precision=5, scale=2),
            server_default="0.00",
            nullable=False,
        ),
    )
    op.alter_column("products", "discount_percent", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "discount_percent")
