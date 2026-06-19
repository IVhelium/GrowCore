from collections import defaultdict
from json import JSONDecodeError
from typing import Any
from uuid import UUID
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from src.api.services.chat import ChatService
from src.core.config import settings
from src.core.database import new_session
from src.core.dependencies import CurrentUserDependency
from src.models import UserModel
from src.schemas import CreateUserChatMessageDTO


router = APIRouter(tags=["Chats"])

@router.post("/users/ws-ticket", response_model=dict[str, str])
async def create_websocket_ticket(current_user: CurrentUserDependency):
    ticket = jwt.encode(
        {
            "sub": str(current_user.id),
            "purpose": "chat_websocket",
            "exp": datetime.now(timezone.utc) + timedelta(seconds=60),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    return {"ticket": ticket}


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


async def send_realtime_event(user_id: UUID, payload: dict[str, Any]) -> None:
    await manager.send_to_user(user_id, payload)


async def get_websocket_user(websocket: WebSocket) -> UserModel | None:
    token = websocket.query_params.get("ticket") or websocket.cookies.get(settings.JWT_ACCESS_COOKIE_NAME)

    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if websocket.query_params.get("ticket") and payload.get("purpose") != "chat_websocket":
            return None
        user_id = UUID(str(payload.get("sub")))
    except Exception:
        return None

    async with new_session() as db:
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()


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
                message_schema = CreateUserChatMessageDTO(message=message_text)
                async with new_session() as db:
                    chat_message = await ChatService(db).send_message(
                        current_user=current_user,
                        public_id=recipient_public_id,
                        schema=message_schema,
                    )
            except Exception:
                await websocket.send_json({"type": "error", "message": "Could not send message"})
                continue

            if not chat_message:
                await websocket.send_json({"type": "error", "message": "Could not send message"})
    except WebSocketDisconnect:
        manager.disconnect(current_user.id, websocket)
