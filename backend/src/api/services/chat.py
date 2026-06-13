from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.services.notification import NotificationService
from src.core.constants import PUBLIC_ID_RE
from src.models import UserChatMessageModel, UserFriendModel, UserModel
from src.schemas import CreateUserChatMessageDTO, UserChatThreadDTO


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()
        except SQLAlchemyError:
            pass

    @staticmethod
    def normalize_public_id(public_id: str) -> str:
        value = public_id.strip().upper()

        if not value.startswith("#"):
            value = f"#{value}"

        if not PUBLIC_ID_RE.fullmatch(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid public_id format. Example: #A1B2C3D4E5",
            )

        return value

    @staticmethod
    def serialize_user(user: UserModel) -> dict[str, Any]:
        return {
            "public_id": user.public_id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "is_blocked": user.is_blocked,
        }

    @classmethod
    def serialize_message(cls, message: UserChatMessageModel) -> dict[str, Any]:
        return {
            "id": message.id,
            "message": message.message,
            "created_at": message.created_at.isoformat(),
            "sender": cls.serialize_user(message.sender),
            "recipient": cls.serialize_user(message.recipient),
        }

    async def _get_user_by_public_id(self, public_id: str) -> UserModel:
        normalized_public_id = self.normalize_public_id(public_id)

        try:
            result = await self.db.execute(
                select(UserModel).where(UserModel.public_id == normalized_public_id)
            )
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load user",
            ) from exc

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user

    async def list_threads(
        self,
        current_user: UserModel,
    ) -> list[UserChatThreadDTO]:
        result = await self.db.execute(
            select(UserChatMessageModel)
            .options(
                selectinload(UserChatMessageModel.sender),
                selectinload(UserChatMessageModel.recipient),
            )
            .where(
                or_(
                    UserChatMessageModel.sender_id == current_user.id,
                    UserChatMessageModel.recipient_id == current_user.id,
                )
            )
            .order_by(UserChatMessageModel.created_at.desc())
            .limit(200)
        )

        threads = []
        seen_user_ids = set()

        for message in result.scalars().all():
            peer = message.recipient if message.sender_id == current_user.id else message.sender

            if peer.id in seen_user_ids:
                continue

            seen_user_ids.add(peer.id)
            threads.append(
                UserChatThreadDTO(
                    user=peer,
                    last_message=message.message,
                    last_message_at=message.created_at,
                )
            )

        friends_result = await self.db.execute(
            select(UserModel)
            .join(UserFriendModel, UserFriendModel.friend_id == UserModel.id)
            .where(UserFriendModel.user_id == current_user.id)
            .order_by(UserModel.username.asc())
        )

        for friend in friends_result.scalars().all():
            if friend.id in seen_user_ids:
                continue

            seen_user_ids.add(friend.id)
            threads.append(UserChatThreadDTO(user=friend))

        return threads

    async def list_messages(
        self,
        current_user: UserModel,
        public_id: str,
    ) -> list[UserChatMessageModel]:
        target = await self._get_user_by_public_id(public_id)

        result = await self.db.execute(
            select(UserChatMessageModel)
            .options(
                selectinload(UserChatMessageModel.sender),
                selectinload(UserChatMessageModel.recipient),
            )
            .where(
                or_(
                    and_(
                        UserChatMessageModel.sender_id == current_user.id,
                        UserChatMessageModel.recipient_id == target.id,
                    ),
                    and_(
                        UserChatMessageModel.sender_id == target.id,
                        UserChatMessageModel.recipient_id == current_user.id,
                    ),
                )
            )
            .order_by(UserChatMessageModel.created_at.asc())
        )

        return list(result.scalars().all())

    async def send_message(
        self,
        current_user: UserModel,
        public_id: str,
        schema: CreateUserChatMessageDTO,
    ) -> UserChatMessageModel:
        target = await self._get_user_by_public_id(public_id)

        if target.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You cannot chat with yourself",
            )

        message = UserChatMessageModel(
            sender_id=current_user.id,
            recipient_id=target.id,
            message=schema.message,
        )
        self.db.add(message)

        await NotificationService(self.db).create(
            user_id=target.id,
            title="New chat message",
            message=f"{current_user.username} sent you a message.",
        )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not send message",
            ) from exc

        result = await self.db.execute(
            select(UserChatMessageModel)
            .options(
                selectinload(UserChatMessageModel.sender),
                selectinload(UserChatMessageModel.recipient),
            )
            .where(UserChatMessageModel.id == message.id)
        )

        created_message = result.scalar_one_or_none()

        if not created_message:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Message was not created",
            )

        try:
            from src.api.routers.chat_ws import send_realtime_event

            event = {
                "type": "message",
                "message": self.serialize_message(created_message),
            }
            await send_realtime_event(created_message.sender_id, event)
            await send_realtime_event(created_message.recipient_id, event)
        except Exception:
            pass

        return created_message
