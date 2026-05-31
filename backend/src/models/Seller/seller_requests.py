from datetime import datetime
import enum
import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.constants import SellerRequestStatus
from src.core.custom_types import intPk, createdAt
from src.core.database import Base




class SellerRequestModel(Base):
    __tablename__ = "seller_requests"
    
    id: Mapped[intPk]
    passport_id: Mapped[str] = mapped_column(String, unique=True)
    full_name: Mapped[str]
    phone_number: Mapped[str] = mapped_column(String, unique=True)
    country: Mapped[str]
    
    message: Mapped[str]
    status: Mapped[SellerRequestStatus] = mapped_column(default=SellerRequestStatus.pending, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    
    reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    user: Mapped["UserModel"] = relationship(
        back_populates="seller_request",
        uselist=False,
        foreign_keys=[user_id],
    )
    
    reviewed_by: Mapped["UserModel | None"] = relationship(
        foreign_keys=[reviewer_id]
    )
