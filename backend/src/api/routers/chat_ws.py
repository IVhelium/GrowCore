from collections import defaultdict
from json import JSONDecodeError
from typing import Any
from uuid import UUID

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from src.api.services.notification import NotificationService
from src.api.services.user import UserService
from src.core.config import settings
from src.core.database import new_session
from src.models import UserChatMessageModel, UserModel


router = APIRouter(tags=["Chats"])


def serialize_user(user: UserModel) -> dict[str, Any]:
    return {
        "public_id": user.public_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "is_blocked": user.is_blocked,
    }


def serialize_message(message: UserChatMessageModel) -> dict[str, Any]:
    return {
        "id": message.id,
        "message": message.message,
        "created_at": message.created_at.isoformat(),
        "sender": serialize_user(message.sender),
        "recipient": serialize_user(message.recipient),
    }


class ChatConnectionManager:
    def __init__(self):
        self.connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[user_id].add(websocket)

    def disconnect(self, user_id: UUID, websocket: WebSocket) -> None:
        self.connections[user_id].discard(websocket)
        if not self.connections[user_id]:
            del self.connections[user_id]

    async def send_to_user(self, user_id: UUID, payload: dict[str, Any]) -> None:
        stale_connections = []

        for websocket in self.connections.get(user_id, set()).copy():
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            self.disconnect(user_id, websocket)


manager = ChatConnectionManager()


async def get_websocket_user(websocket: WebSocket) -> UserModel | None:
    token = websocket.cookies.get(settings.JWT_ACCESS_COOKIE_NAME)

    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = UUID(str(payload.get("sub")))
    except Exception:
        return None

    async with new_session() as db:
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()


async def create_chat_message(
    sender: UserModel,
    recipient_public_id: str,
    message_text: str,
) -> UserChatMessageModel:
    async with new_session() as db:
        normalized_public_id = UserService.normalize_public_id(recipient_public_id)
        text = message_text.strip()

        if not text or len(text) > 10_000:
            raise ValueError("Message must be between 1 and 10000 characters")

        result = await db.execute(
            select(UserModel).where(UserModel.public_id == normalized_public_id)
        )
        recipient = result.scalar_one_or_none()

        if not recipient or recipient.id == sender.id:
            raise ValueError("Recipient is not available")

        chat_message = UserChatMessageModel(
            sender_id=sender.id,
            recipient_id=recipient.id,
            message=text,
        )
        db.add(chat_message)

        await NotificationService(db).create(
            user_id=recipient.id,
            title="New chat message",
            message=f"{sender.username} sent you a message.",
        )

        try:
            await db.commit()
        except SQLAlchemyError:
            await db.rollback()
            raise

        created = await db.execute(
            select(UserChatMessageModel)
            .options(
                selectinload(UserChatMessageModel.sender),
                selectinload(UserChatMessageModel.recipient),
            )
            .where(UserChatMessageModel.id == chat_message.id)
        )
        return created.scalar_one()


@router.websocket("/users/ws/chats")
async def user_chat_websocket(websocket: WebSocket):
    current_user = await get_websocket_user(websocket)

    if not current_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(current_user.id, websocket)

    try:
        while True:
            try:
                payload = await websocket.receive_json()
            except JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            recipient_public_id = str(payload.get("recipient_public_id") or "")
            message_text = str(payload.get("message") or "")

            try:
                chat_message = await create_chat_message(
                    sender=current_user,
                    recipient_public_id=recipient_public_id,
                    message_text=message_text,
                )
            except Exception:
                await websocket.send_json({"type": "error", "message": "Could not send message"})
                continue

            event = {
                "type": "message",
                "message": serialize_message(chat_message),
            }
            await manager.send_to_user(chat_message.sender_id, event)
            await manager.send_to_user(chat_message.recipient_id, event)
    except WebSocketDisconnect:
        manager.disconnect(current_user.id, websocket)
