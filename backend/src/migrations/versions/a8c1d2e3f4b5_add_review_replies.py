"""add review replies

Revision ID: a8c1d2e3f4b5
Revises: f2b7c8d9e0a1
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a8c1d2e3f4b5"
down_revision: Union[str, Sequence[str], None] = "f2b7c8d9e0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("reviews", "rating", existing_type=sa.Numeric(precision=3, scale=1), nullable=True)
    op.add_column("reviews", sa.Column("parent_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_reviews_parent_id_reviews",
        "reviews",
        "reviews",
        ["parent_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_reviews_parent_id", "reviews", ["parent_id"])


def downgrade() -> None:
    op.execute("DELETE FROM reviews WHERE parent_id IS NOT NULL")
    op.drop_index("ix_reviews_parent_id", table_name="reviews")
    op.drop_constraint("fk_reviews_parent_id_reviews", "reviews", type_="foreignkey")
    op.drop_column("reviews", "parent_id")
    op.alter_column("reviews", "rating", existing_type=sa.Numeric(precision=3, scale=1), nullable=False)
