"""add discount expiry

Revision ID: 4f6a7b8c9d0e
Revises: e7f8a9b0c1d2
Create Date: 2026-06-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f6a7b8c9d0e"
down_revision: Union[str, Sequence[str], None] = "e7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("discount_expires_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("products", "discount_expires_at")
