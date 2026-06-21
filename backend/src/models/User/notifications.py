import uuid

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.custom_types import intPk, createdAt
from src.core.database import Base


class NotificationModel(Base):
    __tablename__ = "notifications"

    id: Mapped[intPk]
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)
    link_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    group_key: Mapped[str | None] = mapped_column(String(250), nullable=True, index=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[createdAt]

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    user: Mapped["UserModel"] = relationship(back_populates="notifications")
