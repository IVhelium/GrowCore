from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from src.custom_types import intPk
from src.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id: Mapped[intPk]
    price: Mapped[float]
    quantity: Mapped[int] = mapped_column(default=1)
    
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))