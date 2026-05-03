import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str]
    description: Mapped[str]
    price: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    quantity: Mapped[int]
    enabled: Mapped[bool] = mapped_column(default=True)
    
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(precision=3, scale=1), default=0)
    rating_count: Mapped[int] = mapped_column(default=0)
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    
    images = relationship("ProductImage", back_populates="product")
    store = relationship("Store", back_populates="products")
    category = relationship("Category", back_populates="products")
    