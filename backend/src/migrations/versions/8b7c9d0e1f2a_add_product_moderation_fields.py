"""add product moderation fields

Revision ID: 8b7c9d0e1f2a
Revises: 31f5dbfeda6c
Create Date: 2026-05-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8b7c9d0e1f2a"
down_revision: Union[str, Sequence[str], None] = "31f5dbfeda6c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


product_moderation_status = sa.Enum(
    "draft",
    "pending",
    "approved",
    "rejected",
    name="productmoderationstatus",
)


def upgrade() -> None:
    product_moderation_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "products",
        sa.Column(
            "moderation_status",
            product_moderation_status,
            server_default="approved",
            nullable=False,
        ),
    )
    op.add_column(
        "products",
        sa.Column("rejection_reason", sa.String(length=400), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("moderated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("moderator_id", sa.Uuid(), nullable=True),
    )
    op.create_index(
        op.f("ix_products_moderation_status"),
        "products",
        ["moderation_status"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_products_moderator_id_users",
        "products",
        "users",
        ["moderator_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_products_moderator_id_users",
        "products",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_products_moderation_status"), table_name="products")
    op.drop_column("products", "moderator_id")
    op.drop_column("products", "moderated_at")
    op.drop_column("products", "rejection_reason")
    op.drop_column("products", "moderation_status")

    product_moderation_status.drop(op.get_bind(), checkfirst=True)
