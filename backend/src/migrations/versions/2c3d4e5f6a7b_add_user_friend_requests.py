"""add user friend requests

Revision ID: 2c3d4e5f6a7b
Revises: 0f1a2b3c4d5e
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2c3d4e5f6a7b"
down_revision: Union[str, Sequence[str], None] = "0f1a2b3c4d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_friend_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("TIMEZONE('utc', now())"), nullable=False),
        sa.Column("requester_id", sa.Uuid(), nullable=False),
        sa.Column("recipient_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requester_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("requester_id", "recipient_id", name="uq_user_friend_request_pair"),
    )
    op.create_index(op.f("ix_user_friend_requests_recipient_id"), "user_friend_requests", ["recipient_id"], unique=False)
    op.create_index(op.f("ix_user_friend_requests_requester_id"), "user_friend_requests", ["requester_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_friend_requests_requester_id"), table_name="user_friend_requests")
    op.drop_index(op.f("ix_user_friend_requests_recipient_id"), table_name="user_friend_requests")
    op.drop_table("user_friend_requests")
