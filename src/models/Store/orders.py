import uuid
import enum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import intPk, createdAt
from src.core.database import Base


class OrderStatus(enum.Enum):
    inTransit = "In Transit"
    delivered = "Delivered"
    delayed = "Delayed"
    
    
class OrderModel(Base):
    __tablename__ = "orders"
    
    id: Mapped[intPk]
    status: Mapped[OrderStatus]
    total_price: Mapped[float]
    
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
    price: Mapped[float]
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