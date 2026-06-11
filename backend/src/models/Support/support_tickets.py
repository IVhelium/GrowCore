import uuid
from datetime import datetime

from sqlalchemy import Enum as SQLAlchemyEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.constants import SupportTicketStatus, SupportTicketType
from src.core.custom_types import intPk, createdAt, updatedAt
from src.core.database import Base


class SupportTicketModel(Base):
    __tablename__ = "support_tickets"

    id: Mapped[intPk]

    subject: Mapped[str] = mapped_column(String(150))
    ticket_type: Mapped[SupportTicketType] = mapped_column(
        SQLAlchemyEnum(SupportTicketType, name="supporttickettype"),
        default=SupportTicketType.other,
        index=True,
    )

    message: Mapped[str] = mapped_column(String(2000))

    response: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    status: Mapped[SupportTicketStatus] = mapped_column(
        SQLAlchemyEnum(SupportTicketStatus, name="ticketstatus"),
        default=SupportTicketStatus.open,
        index=True,
    )

    created_at: Mapped[createdAt]
    updated_at: Mapped[updatedAt]

    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    assigned_support_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped["UserModel"] = relationship(
        foreign_keys=[user_id],
        back_populates="support_tickets",
    )

    assigned_support: Mapped["UserModel | None"] = relationship(
        foreign_keys=[assigned_support_id],
        back_populates="assigned_tickets",
    )
