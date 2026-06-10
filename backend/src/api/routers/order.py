from fastapi import APIRouter

from src.core.dependencies import AdminDependency, CurrentUserDependency, OrderServiceDependency
from src.schemas import PayOrderDTO, ReadOrderDTO, RequestReturnDTO, UpdateDeliveryDTO


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
        payment_document=schema.payment_document,
    )


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
