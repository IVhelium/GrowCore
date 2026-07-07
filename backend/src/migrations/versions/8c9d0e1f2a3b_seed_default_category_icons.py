"""seed default category icons

Revision ID: 8c9d0e1f2a3b
Revises: 7b8c9d0e1f2a
Create Date: 2026-07-07 19:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8c9d0e1f2a3b"
down_revision: Union[str, Sequence[str], None] = "7b8c9d0e1f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_CATEGORY_ICONS = {
    "Soil Sensors": "Droplets",
    "Climate Sensors": "Thermometer",
    "Irrigation Parts": "Waves",
    "Greenhouse Control": "Cpu",
    "Grow Lights": "Sun",
    "Pumps & Valves": "Gauge",
    "Cables & Connectors": "Cable",
    "Replacement Parts": "Wrench",
    "Hydroponics": "FlaskConical",
}


def upgrade() -> None:
    categories = sa.table(
        "categories",
        sa.column("name", sa.String()),
        sa.column("icon_name", sa.String()),
    )

    for name, icon_name in DEFAULT_CATEGORY_ICONS.items():
        op.execute(
            categories.update()
            .where(categories.c.name == name)
            .where(categories.c.icon_name == "SlidersHorizontal")
            .values(icon_name=icon_name)
        )


def downgrade() -> None:
    categories = sa.table(
        "categories",
        sa.column("name", sa.String()),
        sa.column("icon_name", sa.String()),
    )

    for name, icon_name in DEFAULT_CATEGORY_ICONS.items():
        op.execute(
            categories.update()
            .where(categories.c.name == name)
            .where(categories.c.icon_name == icon_name)
            .values(icon_name="SlidersHorizontal")
        )
