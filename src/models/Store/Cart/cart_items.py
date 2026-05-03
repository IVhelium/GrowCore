import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id: Mapped[intPk]
    quantity: Mapped[int]
    
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"))
    
    cart = relationship("Cart", back_populates="items")