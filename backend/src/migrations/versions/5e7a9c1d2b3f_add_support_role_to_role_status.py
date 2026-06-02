"""add support role to role status

Revision ID: 5e7a9c1d2b3f
Revises: 43db68853a52
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "5e7a9c1d2b3f"
down_revision: Union[str, Sequence[str], None] = "43db68853a52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE rolestatus ADD VALUE IF NOT EXISTS 'support'")


def downgrade() -> None:
    # PostgreSQL does not support dropping enum values safely.
    pass
