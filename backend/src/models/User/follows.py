import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.custom_types import intPk, createdAt
from src.core.database import Base


class UserFollowModel(Base):
    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_follow_pair"),
    )

    id: Mapped[intPk]
    created_at: Mapped[createdAt]

    follower_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    following_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    follower: Mapped["UserModel"] = relationship(
        foreign_keys=[follower_id],
        back_populates="following_relations",
    )
    following: Mapped["UserModel"] = relationship(
        foreign_keys=[following_id],
        back_populates="follower_relations",
    )


class UserFollowEventModel(Base):
    __tablename__ = "user_follow_events"

    id: Mapped[intPk]
    action: Mapped[str]
    created_at: Mapped[createdAt]

    follower_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    following_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
