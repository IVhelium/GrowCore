import uuid
import enum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from src.custom_types import intPk, createdAt
from src.database import Base


class OrderStatus(enum.Enum):
    inTransit = "In Transit"
    delivered = "Delivered"
    delayed = "Delayed"
    
    
class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[intPk]
    status: Mapped[OrderStatus]
    total_price: Mapped[float]
    
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    
