import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk, createdAt
from src.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[intPk]
    title: Mapped[str]
    description: Mapped[str]
    price: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    quantity: Mapped[int]
    enabled: Mapped[bool] = mapped_column(default=True)
    
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(precision=3, scale=1), default=0)
    rating_count: Mapped[int] = mapped_column(default=0)
    
    created_at: Mapped[createdAt]
    
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    
    images = relationship("ProductImage", back_populates="product")
    store = relationship("Store", back_populates="products")
    category = relationship("Category", back_populates="products")
    