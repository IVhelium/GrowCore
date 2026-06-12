"""add stripe and company fee

Revision ID: 0f1a2b3c4d5e
Revises: b1c2d3e4f5a6
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0f1a2b3c4d5e"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("company_fee_total", sa.Numeric(precision=10, scale=2), server_default="0", nullable=False),
    )
    op.add_column(
        "order_items",
        sa.Column("company_fee", sa.Numeric(precision=10, scale=2), server_default="0", nullable=False),
    )
    op.add_column(
        "order_items",
        sa.Column("seller_amount", sa.Numeric(precision=10, scale=2), server_default="0", nullable=False),
    )

    op.alter_column("orders", "company_fee_total", server_default=None)
    op.alter_column("order_items", "company_fee", server_default=None)
    op.alter_column("order_items", "seller_amount", server_default=None)


def downgrade() -> None:
    op.drop_column("order_items", "seller_amount")
    op.drop_column("order_items", "company_fee")
    op.drop_column("orders", "company_fee_total")
