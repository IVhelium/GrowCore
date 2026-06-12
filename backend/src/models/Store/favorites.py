import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.custom_types import intPk, createdAt
from src.core.database import Base


class FavoriteItemModel(Base):
    __tablename__ = "favorites"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="uq_favorite_user_product",
        ),
    )

    id: Mapped[intPk]

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
    )

    created_at: Mapped[createdAt]

    user: Mapped["UserModel"] = relationship(
        back_populates="favorite_items",
    )

    product: Mapped["ProductModel"] = relationship(
        back_populates="favorite_items",
    )