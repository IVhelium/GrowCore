from fastapi import APIRouter, Response, status

from src.core.dependencies import (
    CurrentUserDependency,
    FavoriteServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import (
    AddFavoriteDTO,
    MoveFavoriteToCartDTO,
    PaginationDTO,
    ReadCartDTO,
    ReadFavoriteItemDTO,
)


# This router lets signed-in users manage their saved products list.
router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"],
)


@router.get(
    "",
    response_model=PaginationDTO[ReadFavoriteItemDTO],
)
async def list_my_favorites(
    current_user: CurrentUserDependency,
    favorite_service: FavoriteServiceDependency,
    pagination: PaginationDependency,
):
    """Returns the current user's saved products one page at a time."""

    return await favorite_service.list_my_favorites(
        current_user=current_user,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=ReadFavoriteItemDTO,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_favorites(
    schema: AddFavoriteDTO,
    current_user: CurrentUserDependency,
    favorite_service: FavoriteServiceDependency,
):
    """Saves an available product to the current user's favourites list."""

    return await favorite_service.add_to_favorites(
        current_user=current_user,
        schema=schema,
    )


@router.delete(
    "/{favorite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_from_favorites(
    favorite_id: int,
    current_user: CurrentUserDependency,
    favorite_service: FavoriteServiceDependency,
):
    """Removes one saved product owned by the current user."""

    await favorite_service.remove_from_favorites(
        current_user=current_user,
        favorite_id=favorite_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{favorite_id}/move-to-cart",
    response_model=ReadCartDTO,
)
async def move_favorite_to_cart(
    favorite_id: int,
    schema: MoveFavoriteToCartDTO,
    current_user: CurrentUserDependency,
    favorite_service: FavoriteServiceDependency,
):
    """Moves a saved product into the cart with the chosen quantity."""

    return await favorite_service.move_to_cart(
        current_user=current_user,
        favorite_id=favorite_id,
        schema=schema,
    )
