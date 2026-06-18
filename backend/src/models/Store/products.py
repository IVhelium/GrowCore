from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, JSON, Numeric, String
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
    discount_percent: Mapped[Decimal] = mapped_column(
        Numeric(precision=5, scale=2),
        default=Decimal("0.00"),
    )
    discount_expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    quantity: Mapped[int]
    enabled: Mapped[bool] = mapped_column(default=True)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(precision=3, scale=1), default=0)
    rating_count: Mapped[int] = mapped_column(default=0)
    
    created_at: Mapped[createdAt]
    
    moderation_status: Mapped[ProductModerationStatus] = mapped_column(default=ProductModerationStatus.draft, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(400), nullable=True)
    deletion_reason: Mapped[str | None] = mapped_column(String(400), nullable=True)
    moderated_at: Mapped[datetime | None] = mapped_column(nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    image_storage_prefix: Mapped[str | None] = mapped_column(String(300), unique=True, nullable=True)
    
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    moderator_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    deleted_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    
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

    deleted_by: Mapped["UserModel | None"] = relationship(
        foreign_keys=[deleted_by_id]
    )

    @property
    def discounted_price(self) -> Decimal:
        discount = self.discount_percent or Decimal("0.00")

        if discount <= 0 or not self.has_discount:
            return self.price

        if discount >= 100:
            return Decimal("0.00")

        multiplier = (Decimal("100.00") - discount) / Decimal("100.00")
        return (self.price * multiplier).quantize(Decimal("0.01"))

    @property
    def has_discount(self) -> bool:
        if (self.discount_percent or Decimal("0.00")) <= 0:
            return False

        if self.discount_expires_at and self.discount_expires_at <= datetime.utcnow():
            return False

        return True
    

class ProductImageModel(Base):
    __tablename__ = "product_images"
    
    id: Mapped[intPk]
    image: Mapped[str]
    
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    # Relationships
    product: Mapped["ProductModel"] = relationship(
        back_populates="images"
    )
    
