import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import uuidPk, createdAt
from src.core.database import Base

def generate_public_id():
    return "#" + uuid.uuid4().hex[:10].upper()    # Ограничивает айди до 10 символов

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuidPk]

    public_id: Mapped[str] = mapped_column(
        String(16),
        default=generate_public_id,
        index=True,
        unique=True,
    )

    username: Mapped[str] = mapped_column(String(25), unique=True)
    email: Mapped[str] = mapped_column(String(256), unique=True)
    password_hash: Mapped[str]

    avatar_url: Mapped[str | None] = mapped_column(nullable=True)
    description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    is_blocked: Mapped[bool] = mapped_column(default=False)
    block_reason: Mapped[str | None] = mapped_column(String(400), nullable=True)

    created_at: Mapped[createdAt]

    followers_count: Mapped[int] = mapped_column(default=0)
    following_count: Mapped[int] = mapped_column(default=0)

    roles: Mapped[list["UserRoleModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    seller_request: Mapped["SellerRequestModel | None"] = relationship(
        back_populates="user",
        uselist=False,
        foreign_keys="SellerRequestModel.user_id",
    )

    store: Mapped["StoreModel | None"] = relationship(
        back_populates="user",
        uselist=False,
    )

    cart: Mapped["CartModel | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    favorite_items: Mapped[list["FavoriteItemModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    orders: Mapped[list["OrderModel"]] = relationship(
        back_populates="user",
    )

    reviews: Mapped[list["ReviewModel"]] = relationship(
        back_populates="user",
    )

    support_tickets: Mapped[list["SupportTicketModel"]] = relationship(
        foreign_keys="SupportTicketModel.user_id",
        back_populates="user",
    )

    assigned_tickets: Mapped[list["SupportTicketModel"]] = relationship(
        foreign_keys="SupportTicketModel.assigned_support_id",
        back_populates="assigned_support",
    )

    notifications: Mapped[list["NotificationModel"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    follower_relations: Mapped[list["UserFollowModel"]] = relationship(
        foreign_keys="UserFollowModel.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )

    following_relations: Mapped[list["UserFollowModel"]] = relationship(
        foreign_keys="UserFollowModel.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )
