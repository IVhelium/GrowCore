import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import uuidPk
from src.database import Base

class CartModel(Base):
    __tablename__ = "carts"
    
    id: Mapped[uuidPk]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCAdE"))
    
    items = relationship("CartItemModel", back_populates="cart")