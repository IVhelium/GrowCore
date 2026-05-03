import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class OrderStatus(enum.Enum):
    inTransit = "In Transit"
    delivered = "Delivered"
    delayed = "Delayed"
    
    
class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[OrderStatus]
    total_price: Mapped[float]
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    
