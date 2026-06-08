"""add payments returns delivery and safe product delete

Revision ID: f2b7c8d9e0a1
Revises: d4a9f1b2c3e4
Create Date: 2026-06-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2b7c8d9e0a1"
down_revision: Union[str, Sequence[str], None] = "d4a9f1b2c3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


payment_status = sa.Enum("pending", "paid", "refunded", "failed", name="paymentstatus")
delivery_status = sa.Enum("preparing", "in_transit", "delivered", "delayed", name="deliverystatus")
return_status = sa.Enum("none", "requested", "approved", "rejected", "refunded", name="returnstatus")


def upgrade() -> None:
    bind = op.get_bind()
    payment_status.create(bind, checkfirst=True)
    delivery_status.create(bind, checkfirst=True)
    return_status.create(bind, checkfirst=True)

    op.execute("ALTER TYPE productmoderationstatus ADD VALUE IF NOT EXISTS 'blocked'")
    op.execute("ALTER TYPE productmoderationstatus ADD VALUE IF NOT EXISTS 'deleted'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'returned'")

    op.add_column("products", sa.Column("deletion_reason", sa.String(length=400), nullable=True))
    op.add_column("products", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.add_column("products", sa.Column("deleted_by_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_products_deleted_by_id_users",
        "products",
        "users",
        ["deleted_by_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("seller_requests", sa.Column("document_storage_key", sa.String(), nullable=True))
    op.add_column("seller_requests", sa.Column("document_name", sa.String(length=255), nullable=True))
    op.add_column("seller_requests", sa.Column("document_content_type", sa.String(length=100), nullable=True))

    op.add_column("orders", sa.Column("payment_status", payment_status, server_default="paid", nullable=False))
    op.add_column("orders", sa.Column("delivery_status", delivery_status, server_default="preparing", nullable=False))
    op.add_column("orders", sa.Column("return_status", return_status, server_default="none", nullable=False))
    op.add_column("orders", sa.Column("payment_transaction_id", sa.String(length=80), nullable=True))
    op.add_column("orders", sa.Column("payment_document", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("delivery_address", sa.String(length=300), nullable=True))
    op.add_column("orders", sa.Column("tracking_number", sa.String(length=80), nullable=True))
    op.add_column("orders", sa.Column("return_reason", sa.String(length=400), nullable=True))

    op.alter_column("orders", "payment_status", server_default=None)
    op.alter_column("orders", "delivery_status", server_default=None)
    op.alter_column("orders", "return_status", server_default=None)


def downgrade() -> None:
    op.drop_column("orders", "return_reason")
    op.drop_column("orders", "tracking_number")
    op.drop_column("orders", "delivery_address")
    op.drop_column("orders", "payment_document")
    op.drop_column("orders", "payment_transaction_id")
    op.drop_column("orders", "return_status")
    op.drop_column("orders", "delivery_status")
    op.drop_column("orders", "payment_status")

    op.drop_column("seller_requests", "document_content_type")
    op.drop_column("seller_requests", "document_name")
    op.drop_column("seller_requests", "document_storage_key")

    op.drop_constraint("fk_products_deleted_by_id_users", "products", type_="foreignkey")
    op.drop_column("products", "deleted_by_id")
    op.drop_column("products", "deleted_at")
    op.drop_column("products", "deletion_reason")

    return_status.drop(op.get_bind(), checkfirst=True)
    delivery_status.drop(op.get_bind(), checkfirst=True)
    payment_status.drop(op.get_bind(), checkfirst=True)
