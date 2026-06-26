from fastapi import APIRouter, Response, status

from src.core.dependencies import (
    CartServiceDependency,
    CurrentUserDependency,
)
from src.schemas import (
    AddCartItemDTO,
    CheckoutDTO,
    ReadCartDTO,
    UpdateCartItemDTO,
)


# This router provides the API endpoints for the signed-in user's shopping cart.
router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


@router.get(
    "",
    response_model=ReadCartDTO,
)
async def get_my_cart(
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Loads the current user's cart, creating an empty cart when needed."""

    return await cart_service.get_my_cart(current_user)


@router.post(
    "/items",
    response_model=ReadCartDTO,
    status_code=status.HTTP_201_CREATED,
)
async def add_cart_item(
    schema: AddCartItemDTO,
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Adds a product to the cart or increases its existing quantity."""

    return await cart_service.add_item(
        current_user=current_user,
        schema=schema,
    )


@router.patch(
    "/items/{item_id}",
    response_model=ReadCartDTO,
)
async def update_cart_item(
    item_id: int,
    schema: UpdateCartItemDTO,
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Changes the quantity of one item that belongs to the current user."""

    return await cart_service.update_item_quantity(
        current_user=current_user,
        item_id=item_id,
        schema=schema,
    )


@router.delete(
    "/items/{item_id}",
    response_model=ReadCartDTO,
)
async def remove_cart_item(
    item_id: int,
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Removes one item from the current user's cart."""

    return await cart_service.remove_item(
        current_user=current_user,
        item_id=item_id,
    )


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def clear_cart(
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Removes every item from the current user's cart."""

    await cart_service.clear_cart(current_user)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/checkout",
    response_model=ReadCartDTO,
)
async def checkout_cart(
    schema: CheckoutDTO,
    current_user: CurrentUserDependency,
    cart_service: CartServiceDependency,
):
    """Creates an order from the cart after checking stock and delivery details."""

    return await cart_service.checkout(
        current_user=current_user,
        schema=schema,
    )
