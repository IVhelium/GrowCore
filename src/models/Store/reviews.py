import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(precision=3, scale=1), default=0)
    comment: Mapped[str | None]
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))