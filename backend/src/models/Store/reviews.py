import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import intPk, createdAt
from src.core.database import Base

class ReviewModel(Base):
    __tablename__ = "reviews"
    
    id: Mapped[intPk]
    rating: Mapped[Decimal | None] = mapped_column(Numeric(precision=3, scale=1), nullable=True)
    comment: Mapped[str | None]
    
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="reviews"
    )
    
    product: Mapped["ProductModel"] = relationship(
        back_populates="reviews"
    )

    parent: Mapped["ReviewModel | None"] = relationship(
        remote_side=lambda: [ReviewModel.id],
        back_populates="replies",
    )

    replies: Mapped[list["ReviewModel"]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
    )
