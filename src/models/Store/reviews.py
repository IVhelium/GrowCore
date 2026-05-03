import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from src.custom_types import intPk, createdAt
from src.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id: Mapped[intPk]
    rating: Mapped[Decimal] = mapped_column(Numeric(precision=3, scale=1), default=0)
    comment: Mapped[str | None]
    
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))