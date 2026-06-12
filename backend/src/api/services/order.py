from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ReturnStatus
from src.api.services.notification import NotificationService
from src.models import CartModel, OrderItemModel, OrderModel, ProductModel, UserModel
from src.schemas import RequestReturnDTO, UpdateDeliveryDTO


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

    async def _get_user_order(
        self,
        current_user: UserModel,
        order_id: int,
    ) -> OrderModel:
        query = (
            select(OrderModel)
            .options(*self._order_options())
            .where(
                OrderModel.id == order_id,
                OrderModel.user_id == current_user.id,
            )
        )

        result = await self.db.execute(query)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        return order

    async def _get_order(self, order_id: int) -> OrderModel:
        query = (
            select(OrderModel)
            .options(*self._order_options())
            .where(OrderModel.id == order_id)
        )

        result = await self.db.execute(query)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        return order

    async def request_return(
        self,
        current_user: UserModel,
        order_id: int,
        schema: RequestReturnDTO,
    ) -> OrderModel:
        order = await self._get_user_order(current_user, order_id)

        if order.return_status != ReturnStatus.none:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Return has already been requested",
            )

        if order.payment_status != PaymentStatus.paid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only paid orders can be returned",
            )

        order.return_status = ReturnStatus.requested
        order.return_reason = schema.reason.strip()

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not request return",
            ) from exc

        return await self._get_user_order(current_user, order.id)

    async def pay_order(
        self,
        current_user: UserModel,
        order_id: int,
        transaction_id: str,
        payment_method: str,
        payment_document: str,
        delivery_address: str | None = None,
        customer_nif: str | None = None,
    ) -> OrderModel:
        order = await self._get_user_order(current_user, order_id)

        if order.payment_status != PaymentStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is not awaiting payment",
            )

        final_delivery_address = (delivery_address or order.delivery_address or "").strip()
        if "portugal" in final_delivery_address.lower() and not (customer_nif or "").strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="NIF is required for Portugal payments",
            )

        for item in order.items:
            product = item.product

            if not product or product.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Not enough quantity for {product.title if product else 'product'}",
                )

        for item in order.items:
            item.product.quantity -= item.quantity

        order.payment_status = PaymentStatus.paid
        order.payment_transaction_id = transaction_id
        order.payment_method = payment_method.strip()
        order.customer_nif = customer_nif.strip() if customer_nif else None
        order.payment_document = payment_document
        if final_delivery_address:
            order.delivery_address = final_delivery_address

        cart_result = await self.db.execute(
            select(CartModel)
            .options(selectinload(CartModel.items))
            .where(CartModel.user_id == current_user.id)
        )
        cart = cart_result.scalar_one_or_none()

        if cart:
            ordered_product_ids = {item.product_id for item in order.items}

            for cart_item in list(cart.items):
                if cart_item.product_id in ordered_product_ids:
                    await self.db.delete(cart_item)

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not pay order",
            ) from exc

        return await self._get_user_order(current_user, order.id)

    async def approve_return(
        self,
        order_id: int,
    ) -> OrderModel:
        order = await self._get_order(order_id)

        if order.return_status != ReturnStatus.requested:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is not awaiting return approval",
            )

        order.return_status = ReturnStatus.refunded
        order.payment_status = PaymentStatus.refunded
        order.status = OrderStatus.returned
        await NotificationService(self.db).create(
            user_id=order.user_id,
            title="Return approved",
            message=f"Return for order #{order.id} was approved and refunded.",
        )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not approve return",
            ) from exc

        return await self._get_order(order.id)

    async def update_delivery(
        self,
        order_id: int,
        schema: UpdateDeliveryDTO,
    ) -> OrderModel:
        order = await self._get_order(order_id)

        order.delivery_status = schema.delivery_status
        order.tracking_number = schema.tracking_number or order.tracking_number

        if schema.delivery_status == DeliveryStatus.delivered:
            order.status = OrderStatus.delivered
        elif schema.delivery_status == DeliveryStatus.delayed:
            order.status = OrderStatus.delayed
        else:
            order.status = OrderStatus.inTransit

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update delivery",
            ) from exc

        return await self._get_order(order.id)
