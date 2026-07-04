from decimal import Decimal

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ReturnStatus
from src.core.config import settings
from src.core.pagination import PaginationParams, PaginationService
from src.api.services.notification import NotificationService
from src.utils.orders import (
    create_payment_document,
    format_stripe_address,
    get_stripe_custom_field,
    get_stripe_shipping_country,
    stripe_metadata_value,
    stripe_object_to_dict,
)
from src.models import CartModel, OrderItemModel, OrderModel, ProductModel, UserModel
from src.schemas import RequestReturnDTO, UpdateDeliveryDTO


# Contains the order business rules, including payments, delivery, and return handling.
class OrderService:
    def __init__(self, db: AsyncSession):
        # Store the database session used by all order operations.
        self.db = db

    async def _safe_rollback(self) -> None:
        """Cancels an unfinished order transaction after a database error."""
        try:
            await self.db.rollback()
        except SQLAlchemyError:
            pass

    @staticmethod
    def _order_options():
        """Defines the related order data loaded together for API responses."""
        return (
            selectinload(OrderModel.items)
            .selectinload(OrderItemModel.product)
            .selectinload(ProductModel.images),
        )

    async def list_my_orders(self, current_user: UserModel) -> list[OrderModel]:
        """Loads the signed-in user's order history with each ordered product."""
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

    async def list_admin_transactions(
        self,
        pagination: PaginationParams,
        payment_status: PaymentStatus | None = None,
    ):
        """Returns paginated order transactions, optionally filtered by payment state."""
        query = (
            select(OrderModel)
            .options(*self._order_options(), selectinload(OrderModel.user))
            .order_by(OrderModel.created_at.desc())
        )

        if payment_status is not None:
            query = query.where(OrderModel.payment_status == payment_status)

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

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

    async def _decrement_order_stock(self, order: OrderModel) -> None:
        required_by_product_id: dict[int, int] = {}

        for item in order.items:
            required_by_product_id[item.product_id] = (
                required_by_product_id.get(item.product_id, 0) + item.quantity
            )

        product_ids = list(required_by_product_id)

        if not product_ids:
            return

        result = await self.db.execute(
            select(ProductModel)
            .where(ProductModel.id.in_(product_ids))
            .with_for_update()
        )
        products_by_id = {product.id: product for product in result.scalars().all()}

        for product_id, required_quantity in required_by_product_id.items():
            product = products_by_id.get(product_id)

            if not product or product.quantity < required_quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Not enough quantity for {product.title if product else 'product'}",
                )

        for product_id, required_quantity in required_by_product_id.items():
            product = products_by_id[product_id]
            product.quantity -= required_quantity

            if product.quantity <= 0:
                product.quantity = 0
                product.enabled = False

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

    async def delete_my_order(
        self,
        current_user: UserModel,
        order_id: int,
    ) -> None:
        order = await self._get_user_order(current_user, order_id)

        if order.payment_status not in {PaymentStatus.pending, PaymentStatus.failed}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only unpaid or failed orders can be deleted",
            )

        try:
            for item in list(order.items):
                await self.db.delete(item)

            await self.db.delete(order)
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete order",
            ) from exc

    async def create_stripe_checkout_session(
        self,
        current_user: UserModel,
        order_id: int,
        delivery_address: str | None = None,
        customer_nif: str | None = None,
    ) -> dict[str, str]:
        order = await self._get_user_order(current_user, order_id)

        if order.payment_status not in {PaymentStatus.pending, PaymentStatus.failed}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is not awaiting payment",
            )

        final_delivery_address = (delivery_address or order.delivery_address or "").strip()
        final_customer_nif = (customer_nif or order.customer_nif or "").strip()
        if "portugal" in final_delivery_address.lower() and not final_customer_nif:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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

        success_url = (
            f"{settings.FRONTEND_URL}/orders?stripe=success"
            f"&order={order.id}&session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = f"{settings.FRONTEND_URL}/payment?stripe=cancel&order={order.id}"
        shipping_countries = settings.STRIPE_SHIPPING_COUNTRY_LIST
        order.customer_nif = final_customer_nif or None
        if final_delivery_address:
            order.delivery_address = final_delivery_address

        stripe_metadata = {
            "order_id": str(order.id),
            "user_id": str(current_user.id),
            "customer_email": stripe_metadata_value(current_user.email),
            "customer_username": stripe_metadata_value(current_user.username),
            "customer_nif": stripe_metadata_value(order.customer_nif),
            "delivery_address": stripe_metadata_value(order.delivery_address),
            "order_total": stripe_metadata_value(order.total_price),
            "company_fee_total": stripe_metadata_value(order.company_fee_total),
            "platform_fee_rate": "10%",
        }

        session_payload = {
            "mode": "payment",
            "line_items": line_items,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "client_reference_id": str(order.id),
            "customer_email": current_user.email,
            "billing_address_collection": "auto",
            "custom_fields": [
                {
                    "key": "nif",
                    "label": {
                        "type": "custom",
                        "custom": "NIF / Tax ID",
                    },
                    "type": "text",
                    "optional": False,
                    "text": {
                        "minimum_length": 9,
                        "maximum_length": 20,
                    },
                }
            ],
            "custom_text": {
                "shipping_address": {
                    "message": "For Portugal, a valid NIF is required for the receipt.",
                },
            },
            "metadata": stripe_metadata,
            "payment_intent_data": {
                "metadata": stripe_metadata,
            },
        }

        if settings.STRIPE_AUTOMATIC_TAX:
            session_payload["automatic_tax"] = {"enabled": True}

        if shipping_countries:
            session_payload["shipping_address_collection"] = {
                "allowed_countries": shipping_countries,
            }

        try:
            session = stripe.checkout.Session.create(**session_payload)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not create Stripe checkout session",
            ) from exc

        order.payment_method = "stripe"
        order.payment_status = PaymentStatus.pending
        order.payment_transaction_id = session.id

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update order payment details",
            ) from exc

        return {"url": session.url, "session_id": session.id}

    async def confirm_stripe_checkout_session(
        self,
        current_user: UserModel,
        session_id: str,
    ) -> OrderModel:
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

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not verify Stripe checkout session",
            ) from exc

        session = stripe_object_to_dict(session)
        metadata = session.get("metadata") or {}

        try:
            order_id = int(metadata.get("order_id") or 0)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe session is missing order metadata",
            ) from exc

        user_id = metadata.get("user_id")

        if not order_id or user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Stripe session does not belong to the current user",
            )

        order = await self._get_user_order(current_user, order_id)

        if order.payment_status == PaymentStatus.paid:
            updated = False
            if not order.delivery_address:
                stripe_delivery_address = format_stripe_address(
                    session.get("shipping_details") or session.get("customer_details"),
                )
                if stripe_delivery_address:
                    order.delivery_address = stripe_delivery_address
                    updated = True

            customer_nif = get_stripe_custom_field(session, "nif")
            if customer_nif and not order.customer_nif:
                order.customer_nif = customer_nif
                updated = True

            if updated:
                try:
                    await self.db.commit()
                except SQLAlchemyError as exc:
                    await self._safe_rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not sync Stripe order details",
                    ) from exc
                return await self._get_user_order(current_user, order.id)

            return order

        if session.get("payment_status") != "paid":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Stripe payment is not completed yet",
            )

        await self._mark_order_paid_from_stripe(order, session)
        return await self._get_user_order(current_user, order.id)

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

        event_type = event["type"]
        stripe_object = stripe_object_to_dict(event["data"]["object"])

        if event_type in {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
        }:
            order = await self._get_order_from_stripe_object(stripe_object)

            if order.payment_status == PaymentStatus.paid:
                return {"received": True}

            if stripe_object.get("payment_status") != "paid":
                return {"received": True}

            return await self._mark_order_paid_from_stripe(order, stripe_object)

        if event_type in {
            "checkout.session.async_payment_failed",
            "checkout.session.expired",
            "payment_intent.payment_failed",
            "payment_intent.canceled",
        }:
            order = await self._get_order_from_stripe_object(
                stripe_object,
                required=False,
            )

            if not order:
                return {"received": True}

            return await self._mark_order_payment_failed(order, stripe_object)

        if event_type == "refund.updated":
            return await self._sync_order_refund(stripe_object)

        if event_type == "charge.refunded":
            return await self._sync_order_refunded_charge(stripe_object)

        return {"received": True}

    async def _get_order_from_stripe_object(
        self,
        stripe_object: dict,
        required: bool = True,
    ) -> OrderModel | None:
        metadata = stripe_object.get("metadata") or {}

        try:
            order_id = int(metadata.get("order_id") or stripe_object.get("client_reference_id") or 0)
        except (TypeError, ValueError) as exc:
            if not required:
                return None

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe object is missing order metadata",
            ) from exc

        if not order_id:
            if not required:
                return None

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stripe object is missing order metadata",
            )

        return await self._get_order(order_id)

    async def _mark_order_payment_failed(
        self,
        order: OrderModel,
        stripe_object: dict,
    ) -> dict[str, bool]:
        if order.payment_status in {PaymentStatus.paid, PaymentStatus.refunded}:
            return {"received": True}

        order.payment_status = PaymentStatus.failed
        order.payment_method = "stripe"

        stripe_id = stripe_object.get("id")
        if stripe_id:
            order.payment_transaction_id = str(stripe_id)

        await NotificationService(self.db).create(
            user_id=order.user_id,
            title="Payment failed",
            message=f"Payment for order #{order.id} was not completed. You can try paying again.",
            link_url=f"/payment?order={order.id}",
            group_key=f"order:{order.id}:payment-failed",
        )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark payment as failed",
            ) from exc

        return {"received": True}

    async def _mark_order_paid_from_stripe(
        self,
        order: OrderModel,
        session: dict,
    ) -> dict[str, bool]:
        await self._decrement_order_stock(order)

        order.payment_status = PaymentStatus.paid
        order.payment_transaction_id = session["id"]
        order.payment_method = "stripe"
        customer_nif = get_stripe_custom_field(session, "nif")
        shipping_country = get_stripe_shipping_country(session)

        if shipping_country == "PT" and not customer_nif:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="NIF is required for Portugal payments",
            )

        if customer_nif:
            order.customer_nif = customer_nif

        stripe_delivery_address = format_stripe_address(
            session.get("shipping_details") or session.get("customer_details"),
        )
        if stripe_delivery_address:
            order.delivery_address = stripe_delivery_address
        order.payment_document = create_payment_document(order, session)

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

    def _restore_order_stock_once(self, order: OrderModel) -> None:
        if order.return_status == ReturnStatus.refunded:
            return

        for item in order.items:
            if item.product:
                item.product.quantity += item.quantity
                if item.product.quantity > 0:
                    item.product.enabled = True

    async def _mark_order_refunded_from_stripe(
        self,
        order: OrderModel,
        refund_id: str | None = None,
    ) -> dict[str, bool]:
        self._restore_order_stock_once(order)

        order.return_status = ReturnStatus.refunded
        order.payment_status = PaymentStatus.refunded
        order.status = OrderStatus.returned

        if refund_id:
            order.payment_transaction_id = refund_id

        await NotificationService(self.db).create(
            user_id=order.user_id,
            title="Return refunded",
            message=f"Return for order #{order.id} was refunded.",
            link_url="/orders",
            group_key=f"order:{order.id}:return-refunded",
        )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark order as refunded",
            ) from exc

        return {"received": True}

    async def _sync_order_refund(self, refund: dict) -> dict[str, bool]:
        order = await self._get_order_from_stripe_object(refund, required=False)

        if not order:
            return {"received": True}

        refund_status = refund.get("status")

        if refund_status == "succeeded":
            return await self._mark_order_refunded_from_stripe(
                order,
                refund_id=refund.get("id"),
            )

        if refund_status in {"failed", "canceled"}:
            order.return_status = ReturnStatus.requested
            order.payment_status = PaymentStatus.paid

            await NotificationService(self.db).create(
                user_id=order.user_id,
                title="Refund failed",
                message=f"Refund for order #{order.id} did not complete. Support will review it.",
                link_url="/orders",
                group_key=f"order:{order.id}:refund-failed",
            )

            try:
                await self.db.commit()
            except SQLAlchemyError as exc:
                await self._safe_rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not sync failed refund",
                ) from exc

        return {"received": True}

    async def _sync_order_refunded_charge(self, charge: dict) -> dict[str, bool]:
        metadata = charge.get("metadata") or {}
        order_id = metadata.get("order_id")

        if not order_id:
            return {"received": True}

        order = await self._get_order_from_stripe_object(charge)
        return await self._mark_order_refunded_from_stripe(order, refund_id=charge.get("id"))

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

        if (
            order.payment_method != "stripe"
            or not order.payment_transaction_id
            or not settings.STRIPE_SECRET_KEY
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order does not have a refundable Stripe payment",
            )

        try:
            import stripe
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe package is not installed",
            ) from exc

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            session = stripe.checkout.Session.retrieve(order.payment_transaction_id)
            payment_intent = getattr(session, "payment_intent", None)
            if not payment_intent:
                raise ValueError("Stripe session has no payment intent")

            refund = stripe.Refund.create(
                payment_intent=payment_intent,
                metadata={
                    "order_id": str(order.id),
                    "user_id": str(order.user_id),
                },
                idempotency_key=f"growcore-order-{order.id}-return",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Stripe refund could not be created",
            ) from exc

        refund = stripe_object_to_dict(refund)
        refund_status = refund.get("status")

        if refund_status == "succeeded":
            self._restore_order_stock_once(order)
            order.return_status = ReturnStatus.refunded
            order.payment_status = PaymentStatus.refunded
            order.status = OrderStatus.returned
            order.payment_transaction_id = refund.get("id") or order.payment_transaction_id
            notification_title = "Return refunded"
            notification_message = f"Return for order #{order.id} was approved and refunded."
        else:
            order.return_status = ReturnStatus.approved
            notification_title = "Return approved"
            notification_message = (
                f"Return for order #{order.id} was approved. "
                "Refund processing is waiting for Stripe confirmation."
            )

        await NotificationService(self.db).create(
            user_id=order.user_id,
            title=notification_title,
            message=notification_message,
            link_url="/orders",
            group_key=f"order:{order.id}:return",
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

    async def reject_return(
        self,
        order_id: int,
        reason: str,
    ) -> OrderModel:
        order = await self._get_order(order_id)

        if order.return_status != ReturnStatus.requested:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is not awaiting return review",
            )

        order.return_status = ReturnStatus.rejected
        order.return_reason = reason.strip()
        await NotificationService(self.db).create(
            user_id=order.user_id,
            title="Return rejected",
            message=f"Return for order #{order.id} was rejected. Reason: {order.return_reason}",
            link_url="/orders",
            group_key=f"order:{order.id}:return",
        )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not reject return",
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
