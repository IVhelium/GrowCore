from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.constants import ProductModerationStatus
from src.core.custom_types import intPk, createdAt
from src.core.database import Base

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
    
    moderation_status: Mapped[ProductModerationStatus] = mapped_column(default=ProductModerationStatus.draft, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(400), nullable=True)
    moderated_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    image_storage_prefix: Mapped[str | None] = mapped_column(String(300), unique=True, nullable=True)
    
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    moderator_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    images: Mapped[list["ProductImageModel"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )
    
    store: Mapped["StoreModel"] = relationship(
        back_populates="products"
    )
    
    category: Mapped["CategoryModel"] = relationship(
        back_populates="products"
    )
    
    reviews: Mapped[list["ReviewModel"]] = relationship(
        back_populates="product"
    )
    
    cart_items: Mapped[list["CartItemModel"]] = relationship(
        back_populates="product"
    )
    
    favorite_items: Mapped[list["FavoriteItemModel"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan"
    )
    
    order_items: Mapped[list["OrderItemModel"]] = relationship(
        back_populates="product"
    )
    
    moderator: Mapped["UserModel | None"] = relationship(
        foreign_keys=[moderator_id]
    )
    
    

class ProductImageModel(Base):
    __tablename__ = "product_images"
    
    id: Mapped[intPk]
    image: Mapped[str]
    
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    # Relationships
    product: Mapped["ProductModel"] = relationship(
        back_populates="images"
    )
    