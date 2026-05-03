import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int]
    
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"))
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id"))
    
    cart = relationship("Cart", back_populates="items")