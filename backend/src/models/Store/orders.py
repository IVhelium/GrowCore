from decimal import Decimal
import uuid
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.src.core.constants import OrderStatus
from backend.src.core.custom_types import intPk, createdAt
from backend.src.core.database import Base

    
    
class OrderModel(Base):
    __tablename__ = "orders"
    
    id: Mapped[intPk]
    status: Mapped[OrderStatus]
    total_price: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="orders"
    )
    
    items: Mapped[list["OrderItemModel"]] = relationship(
        back_populates="order"
    )
    
    
class OrderItemModel(Base):
    __tablename__ = "order_items"
    
    id: Mapped[intPk]
    price: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    quantity: Mapped[int] = mapped_column(default=1)
    
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    # Relationships
    order: Mapped["OrderModel"] = relationship(
        back_populates="items"
    )
    
    product: Mapped["ProductModel"] = relationship(
        back_populates="order_items"
    )