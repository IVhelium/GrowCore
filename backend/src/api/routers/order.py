from fastapi import APIRouter

from src.core.dependencies import CurrentUserDependency, OrderServiceDependency
from src.schemas import ReadOrderDTO


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
