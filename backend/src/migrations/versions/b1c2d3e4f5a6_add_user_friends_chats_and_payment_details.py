"""add user friends chats and payment details

Revision ID: b1c2d3e4f5a6
Revises: 9a3b4c5d6e7f
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "9a3b4c5d6e7f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("payment_method", sa.String(length=40), nullable=True))
    op.add_column("orders", sa.Column("customer_nif", sa.String(length=20), nullable=True))

    op.create_table(
        "user_friends",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("TIMEZONE('utc', now())"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("friend_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["friend_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "friend_id", name="uq_user_friend_pair"),
    )
    op.create_index(op.f("ix_user_friends_friend_id"), "user_friends", ["friend_id"], unique=False)
    op.create_index(op.f("ix_user_friends_user_id"), "user_friends", ["user_id"], unique=False)

    op.create_table(
        "user_chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("TIMEZONE('utc', now())"), nullable=False),
        sa.Column("sender_id", sa.Uuid(), nullable=False),
        sa.Column("recipient_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_chat_messages_recipient_id"), "user_chat_messages", ["recipient_id"], unique=False)
    op.create_index(op.f("ix_user_chat_messages_sender_id"), "user_chat_messages", ["sender_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_chat_messages_sender_id"), table_name="user_chat_messages")
    op.drop_index(op.f("ix_user_chat_messages_recipient_id"), table_name="user_chat_messages")
    op.drop_table("user_chat_messages")

    op.drop_index(op.f("ix_user_friends_user_id"), table_name="user_friends")
    op.drop_index(op.f("ix_user_friends_friend_id"), table_name="user_friends")
    op.drop_table("user_friends")

    op.drop_column("orders", "customer_nif")
    op.drop_column("orders", "payment_method")
