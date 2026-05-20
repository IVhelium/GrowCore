import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.src.core.custom_types import uuidPk, intPk
from backend.src.core.database import Base

class CartModel(Base):
    __tablename__ = "carts"
    
    id: Mapped[uuidPk]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="cart",
        uselist=False
    )
    
    items: Mapped[list["CartItemModel"]] = relationship(
        back_populates="cart"
    )
    
    
class CartItemModel(Base):
    __tablename__ = "cart_items"
    
    id: Mapped[intPk]
    quantity: Mapped[int]
    
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"))
    
    # Relationships
    product: Mapped["ProductModel"] = relationship(
        back_populates="cart_items"
    )
    
    cart: Mapped["CartModel"] = relationship(
        back_populates="items"
    )