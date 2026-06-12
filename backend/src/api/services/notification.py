from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.pagination import PaginationParams, PaginationService
from src.models import NotificationModel, UserModel


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        user_id,
        title: str,
        message: str,
    ) -> NotificationModel:
        notification = NotificationModel(
            user_id=user_id,
            title=title,
            message=message,
        )
        self.db.add(notification)
        return notification

    async def list_notifications(
        self,
        current_user: UserModel,
        pagination: PaginationParams,
    ):
        query = (
            select(NotificationModel)
            .where(NotificationModel.user_id == current_user.id)
            .order_by(NotificationModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def unread_count(self, current_user: UserModel) -> int:
        try:
            return await self.db.scalar(
                select(func.count())
                .select_from(NotificationModel)
                .where(
                    NotificationModel.user_id == current_user.id,
                    NotificationModel.read_at.is_(None),
                )
            ) or 0
        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load notification count",
            ) from exc

    async def mark_read(
        self,
        current_user: UserModel,
        notification_id: int,
    ) -> NotificationModel:
        query = (
            select(NotificationModel)
            .where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == current_user.id,
            )
        )

        result = await self.db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        notification.read_at = datetime.utcnow()

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark notification as read",
            ) from exc

        return notification

    async def mark_all_read(self, current_user: UserModel) -> int:
        try:
            result = await self.db.execute(
                update(NotificationModel)
                .where(
                    NotificationModel.user_id == current_user.id,
                    NotificationModel.read_at.is_(None),
                )
                .values(read_at=datetime.utcnow())
            )
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark notifications as read",
            ) from exc

        return result.rowcount or 0

    async def delete_all(self, current_user: UserModel) -> int:
        try:
            result = await self.db.execute(
                delete(NotificationModel)
                .where(NotificationModel.user_id == current_user.id)
            )
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete notifications",
            ) from exc

        return result.rowcount or 0
