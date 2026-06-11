"""support type and follow events

Revision ID: 9a3b4c5d6e7f
Revises: 9a2b3c4d5e6f
Create Date: 2026-06-11 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a3b4c5d6e7f"
down_revision: Union[str, Sequence[str], None] = "9a2b3c4d5e6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


support_ticket_type = sa.Enum(
    "account",
    "order",
    "payment",
    "return_request",
    "seller",
    "technical",
    "other",
    name="supporttickettype",
)


def upgrade() -> None:
    bind = op.get_bind()
    support_ticket_type.create(bind, checkfirst=True)

    op.add_column(
        "support_tickets",
        sa.Column("ticket_type", support_ticket_type, server_default="other", nullable=False),
    )
    op.create_index(op.f("ix_support_tickets_ticket_type"), "support_tickets", ["ticket_type"], unique=False)
    op.alter_column("support_tickets", "ticket_type", server_default=None)

    op.create_table(
        "user_follow_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("TIMEZONE('utc', now())"), nullable=False),
        sa.Column("follower_id", sa.Uuid(), nullable=False),
        sa.Column("following_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_follow_events_follower_id"), "user_follow_events", ["follower_id"], unique=False)
    op.create_index(op.f("ix_user_follow_events_following_id"), "user_follow_events", ["following_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_follow_events_following_id"), table_name="user_follow_events")
    op.drop_index(op.f("ix_user_follow_events_follower_id"), table_name="user_follow_events")
    op.drop_table("user_follow_events")
    op.drop_index(op.f("ix_support_tickets_ticket_type"), table_name="support_tickets")
    op.drop_column("support_tickets", "ticket_type")
    support_ticket_type.drop(op.get_bind(), checkfirst=True)
