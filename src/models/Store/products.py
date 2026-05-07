import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk, createdAt
from src.database import Base

class ProductModel(Base):
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
    
    images: Mapped[list["ProductImageModel"]] = relationship(back_populates="product")
    store: Mapped["StoreModel"] = relationship(back_populates="products")
    category: Mapped["CategoryModel"] = relationship(back_populates="products")
    
    

class ProductImageModel(Base):
    __tablename__ = "product_images"
    
    id: Mapped[intPk]
    image: Mapped[str]
    
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    product: Mapped["ProductModel"] = relationship(back_populates="images")
    