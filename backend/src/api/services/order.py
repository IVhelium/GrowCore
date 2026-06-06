from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models import OrderItemModel, OrderModel, ProductModel, UserModel


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()
        except SQLAlchemyError:
            pass

    @staticmethod
    def _order_options():
        return (
            selectinload(OrderModel.items)
            .selectinload(OrderItemModel.product)
            .selectinload(ProductModel.images),
        )

    async def list_my_orders(self, current_user: UserModel) -> list[OrderModel]:
        query = (
            select(OrderModel)
            .options(*self._order_options())
            .where(OrderModel.user_id == current_user.id)
            .order_by(OrderModel.created_at.desc())
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load orders",
            ) from exc

        return list(result.scalars().unique().all())
