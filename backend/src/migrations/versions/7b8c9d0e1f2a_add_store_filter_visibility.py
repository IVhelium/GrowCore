"""add store filter visibility

Revision ID: 7b8c9d0e1f2a
Revises: 6a7b8c9d0e1f
"""
from alembic import op
import sqlalchemy as sa

revision = "7b8c9d0e1f2a"
down_revision = "6a7b8c9d0e1f"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("stores", sa.Column("show_in_filters", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_stores_show_in_filters", "stores", ["show_in_filters"])

def downgrade():
    op.drop_index("ix_stores_show_in_filters", table_name="stores")
    op.drop_column("stores", "show_in_filters")
