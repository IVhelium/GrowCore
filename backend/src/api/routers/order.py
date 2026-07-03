from fastapi import APIRouter, Query, Request, Response, status

from src.core.dependencies import AdminDependency, CurrentUserDependency, OrderServiceDependency
from src.core.constants import PaymentStatus
from src.core.pagination import PaginationDependency
from src.schemas import CreateStripeCheckoutDTO, PaginationDTO, ReadOrderDTO, RejectReturnDTO, RequestReturnDTO, UpdateDeliveryDTO


# This router handles customer orders, Stripe payments, delivery updates, and returns.
router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.get(
    "",
    response_model=list[ReadOrderDTO],
)
async def list_my_orders(
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    """Returns every order placed by the current user, newest first."""

    return await order_service.list_my_orders(current_user)


@router.get(
    "/admin/transactions",
    response_model=PaginationDTO[ReadOrderDTO],
)
async def list_admin_transactions(
    admin: AdminDependency,
    order_service: OrderServiceDependency,
    pagination: PaginationDependency,
    payment_status: PaymentStatus | None = Query(default=None),
):
    """Lets an administrator browse payment transactions and filter by payment status."""
    return await order_service.list_admin_transactions(
        pagination=pagination,
        payment_status=payment_status,
    )


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_order(
    order_id: int,
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    """Deletes an order only when it belongs to the current user and can be removed."""
    await order_service.delete_my_order(
        current_user=current_user,
        order_id=order_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{order_id}/stripe-checkout",
    response_model=dict[str, str],
)
async def create_stripe_checkout(
    order_id: int,
    schema: CreateStripeCheckoutDTO,
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    """Creates a Stripe checkout session for a pending customer order."""
    return await order_service.create_stripe_checkout_session(
        current_user=current_user,
        order_id=order_id,
        delivery_address=schema.delivery_address,
        customer_nif=schema.customer_nif,
    )


@router.post(
    "/stripe/confirm",
    response_model=ReadOrderDTO,
)
async def confirm_stripe_checkout(
    session_id: str,
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    """Confirms a completed Stripe session and returns the updated order."""
    return await order_service.confirm_stripe_checkout_session(
        current_user=current_user,
        session_id=session_id,
    )


@router.post(
    "/stripe/webhook",
    response_model=dict[str, bool],
)
async def stripe_webhook(
    request: Request,
    order_service: OrderServiceDependency,
):
    """Receives trusted payment events sent directly by Stripe."""
    return await order_service.handle_stripe_webhook(request)


@router.post(
    "/{order_id}/returns",
    response_model=ReadOrderDTO,
)
async def request_order_return(
    order_id: int,
    schema: RequestReturnDTO,
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    """Submits a customer's request to return a delivered order."""
    return await order_service.request_return(
        current_user=current_user,
        order_id=order_id,
        schema=schema,
    )


@router.patch(
    "/admin/{order_id}/delivery",
    response_model=ReadOrderDTO,
)
async def update_order_delivery(
    order_id: int,
    schema: UpdateDeliveryDTO,
    admin: AdminDependency,
    order_service: OrderServiceDependency,
):
    """Allows an administrator to update delivery status and tracking information."""
    return await order_service.update_delivery(
        order_id=order_id,
        schema=schema,
    )


@router.patch(
    "/admin/{order_id}/returns/approve",
    response_model=ReadOrderDTO,
)
async def approve_order_return(
    order_id: int,
    admin: AdminDependency,
    order_service: OrderServiceDependency,
):
    """Approves a return request and starts the order return workflow."""
    return await order_service.approve_return(order_id=order_id)


@router.patch(
    "/admin/{order_id}/returns/reject",
    response_model=ReadOrderDTO,
)
async def reject_order_return(
    order_id: int,
    schema: RejectReturnDTO,
    admin: AdminDependency,
    order_service: OrderServiceDependency,
):
    """Rejects a return request and keeps the order paid."""
    return await order_service.reject_return(
        order_id=order_id,
        reason=schema.reason,
    )
