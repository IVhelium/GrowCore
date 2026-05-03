import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class SellerRequestStatus(enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"

class SellerRequest(Base):
    __tablename__ = "seller_requests"
    
    id: Mapped[int] = mapped_column(primary_key=True,)
    passport_id: Mapped[str] = mapped_column(String, unique=True)
    full_name: Mapped[str]
    phone_number: Mapped[str] = mapped_column(String, unique=True)
    country: Mapped[str]
    
    message: Mapped[str]
    status: Mapped[SellerRequestStatus] = mapped_column(default=SellerRequestStatus.pending)
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))