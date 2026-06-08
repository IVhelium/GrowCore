from decimal import Decimal
import uuid
from sqlalchemy import Enum as SQLAlchemyEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ReturnStatus
from src.core.custom_types import intPk, createdAt
from src.core.database import Base

    
    
class OrderModel(Base):
    __tablename__ = "orders"
    
    id: Mapped[intPk]
    status: Mapped[OrderStatus] = mapped_column(
        SQLAlchemyEnum(OrderStatus, name="orderstatus"),
        default=OrderStatus.inTransit,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLAlchemyEnum(PaymentStatus, name="paymentstatus"),
        default=PaymentStatus.pending,
    )
    delivery_status: Mapped[DeliveryStatus] = mapped_column(
        SQLAlchemyEnum(DeliveryStatus, name="deliverystatus"),
        default=DeliveryStatus.preparing,
    )
    return_status: Mapped[ReturnStatus] = mapped_column(
        SQLAlchemyEnum(ReturnStatus, name="returnstatus"),
        default=ReturnStatus.none,
    )
    total_price: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=2))
    payment_transaction_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    payment_document: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    return_reason: Mapped[str | None] = mapped_column(String(400), nullable=True)
    
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
