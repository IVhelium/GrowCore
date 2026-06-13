from fastapi import APIRouter, Request, Response, status

from src.core.dependencies import AdminDependency, CurrentUserDependency, OrderServiceDependency
from src.schemas import CreateStripeCheckoutDTO, PayOrderDTO, ReadOrderDTO, RequestReturnDTO, UpdateDeliveryDTO


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
    """
    Returns the current user's order history
    """

    return await order_service.list_my_orders(current_user)


@router.post(
    "/{order_id}/pay",
    response_model=ReadOrderDTO,
)
async def pay_order(
    order_id: int,
    schema: PayOrderDTO,
    current_user: CurrentUserDependency,
    order_service: OrderServiceDependency,
):
    return await order_service.pay_order(
        current_user=current_user,
        order_id=order_id,
        transaction_id=schema.transaction_id,
        payment_method=schema.payment_method,
        payment_document=schema.payment_document,
        delivery_address=schema.delivery_address,
        customer_nif=schema.customer_nif,
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
    return await order_service.approve_return(order_id=order_id)
