from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    price: Mapped[float]
    quantity: Mapped[int] = mapped_column(default=1)
    
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))