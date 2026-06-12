from decimal import Decimal

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ReturnStatus
from src.core.config import settings
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

    async def create_stripe_checkout_session(
        self,
        current_user: UserModel,
        order_id: int,
        delivery_address: str | None = None,
        customer_nif: str | None = None,
    ) -> dict[str, str]:
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

        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe is not configured",
            )

        try:
            import stripe
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe package is not installed",
            ) from exc

        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = []
        for item in order.items:
            product = item.product
            if not product:
                continue

            unit_amount = int((Decimal(item.price) * 100).quantize(Decimal("1")))
            line_items.append(
                {
                    "price_data": {
                        "currency": settings.STRIPE_CURRENCY.lower(),
                        "product_data": {
                            "name": product.title,
                        },
                        "unit_amount": unit_amount,
                    },
                    "quantity": item.quantity,
                }
            )

        if not line_items:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order has no payable items",
            )

        success_url = f"{settings.FRONTEND_URL}/orders?stripe=success&order={order.id}"
        cancel_url = f"{settings.FRONTEND_URL}/payment?stripe=cancel&order={order.id}"

        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=line_items,
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(order.id),
                metadata={
                    "order_id": str(order.id),
                    "user_id": str(current_user.id),
                    "company_fee_total": str(order.company_fee_total),
                },
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not create Stripe checkout session",
            ) from exc

        order.payment_method = "stripe"
        order.customer_nif = customer_nif.strip() if customer_nif else order.customer_nif
        if final_delivery_address:
            order.delivery_address = final_delivery_address

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update order payment details",
            ) from exc

        return {"url": session.url, "session_id": session.id}

    async def handle_stripe_webhook(self, request: Request) -> dict[str, bool]:
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe webhook is not configured",
            )

        try:
            import stripe
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe package is not installed",
            ) from exc

        payload = await request.body()
        signature = request.headers.get("stripe-signature")

        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Stripe webhook",
            ) from exc

        if event["type"] != "checkout.session.completed":
            return {"received": True}

        session = event["data"]["object"]
        order_id = int(session["metadata"]["order_id"])
        order = await self._get_order(order_id)

        if order.payment_status == PaymentStatus.paid:
            return {"received": True}

        return await self._mark_order_paid_from_stripe(order, session["id"])

    async def _mark_order_paid_from_stripe(
        self,
        order: OrderModel,
        session_id: str,
    ) -> dict[str, bool]:
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
        order.payment_transaction_id = session_id
        order.payment_method = "stripe"

        cart_result = await self.db.execute(
            select(CartModel)
            .options(selectinload(CartModel.items))
            .where(CartModel.user_id == order.user_id)
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
                detail="Could not finalize Stripe payment",
            ) from exc

        return {"received": True}

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
