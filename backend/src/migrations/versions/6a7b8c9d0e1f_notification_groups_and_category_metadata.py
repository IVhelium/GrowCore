"""notification groups and category metadata

Revision ID: 6a7b8c9d0e1f
Revises: 4f6a7b8c9d0e
"""
from alembic import op
import sqlalchemy as sa

revision = "6a7b8c9d0e1f"
down_revision = "4f6a7b8c9d0e"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("notifications", sa.Column("link_url", sa.String(500), nullable=True))
    op.add_column("notifications", sa.Column("group_key", sa.String(250), nullable=True))
    op.add_column("notifications", sa.Column("occurrence_count", sa.Integer(), nullable=False, server_default="1"))
    op.create_index("ix_notifications_group_key", "notifications", ["group_key"])
    op.add_column("categories", sa.Column("icon_name", sa.String(80), nullable=False, server_default="SlidersHorizontal"))
    op.add_column("categories", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))

def downgrade():
    op.drop_column("categories", "sort_order")
    op.drop_column("categories", "icon_name")
    op.drop_index("ix_notifications_group_key", table_name="notifications")
    op.drop_column("notifications", "occurrence_count")
    op.drop_column("notifications", "group_key")
    op.drop_column("notifications", "link_url")
