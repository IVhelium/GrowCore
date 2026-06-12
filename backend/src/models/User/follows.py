import uuid

from sqlalchemy import ForeignKey, Text, UniqueConstraint
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


class UserFriendModel(Base):
    __tablename__ = "user_friends"
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_user_friend_pair"),
    )

    id: Mapped[intPk]
    created_at: Mapped[createdAt]

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    friend_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    user: Mapped["UserModel"] = relationship(
        foreign_keys=[user_id],
        back_populates="friend_relations",
    )
    friend: Mapped["UserModel"] = relationship(
        foreign_keys=[friend_id],
    )


class UserChatMessageModel(Base):
    __tablename__ = "user_chat_messages"

    id: Mapped[intPk]
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[createdAt]

    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    sender: Mapped["UserModel"] = relationship(
        foreign_keys=[sender_id],
        back_populates="sent_chat_messages",
    )
    recipient: Mapped["UserModel"] = relationship(
        foreign_keys=[recipient_id],
        back_populates="received_chat_messages",
    )
