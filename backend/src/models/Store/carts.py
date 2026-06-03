import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import intPk, uuidPk
from src.core.database import Base

class CartModel(Base):
    __tablename__ = "carts"
    
    id: Mapped[uuidPk]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="cart",
        uselist=False
    )
    
    items: Mapped[list["CartItemModel"]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan"
    )
    
    
class CartItemModel(Base):
    __tablename__ = "cart_items"
    
    __table_args__ = (
        UniqueConstraint(
            "cart_id",
            "product_id",
            name="uq_cart_item_cart_product"
        ),
    )
    
    id: Mapped[intPk]
    quantity: Mapped[int] = mapped_column(default=1)
    
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    
    # Relationships
    product: Mapped["ProductModel"] = relationship(
        back_populates="cart_items"
    )
    
    cart: Mapped["CartModel"] = relationship(
        back_populates="items"
    )
