from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.services.cart import CartService
from src.core.constants import ProductModerationStatus
from src.core.pagination import PaginationParams, PaginationService
from src.models import FavoriteItemModel, ProductModel, UserModel
from src.schemas import AddFavoriteDTO, MoveFavoriteToCartDTO, PaginationDTO


class FavoriteService:
    """
    Wishlist Service

    Responsibilities:
    - Adding items to the wishlist
    - Viewing the wishlist
    - Removing items from the wishlist
    - Moving items from the wishlist to the shopping cart
    """


    def __init__(
        self,
        db: AsyncSession,
        cart_service: CartService,
    ):
        self.db = db
        self.cart_service = cart_service


    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass


    @staticmethod
    def _favorite_options():
        return (
            selectinload(FavoriteItemModel.product)
            .selectinload(ProductModel.images),
        )


    async def _get_available_product(
        self,
        product_id: int,
    ) -> ProductModel:
        """
        Returns products that can be added to favorites
        Only approved and enabled products are added to favorites
        """

        query = (
            select(ProductModel)
            .options(selectinload(ProductModel.images))
            .where(ProductModel.id == product_id)
        )

        result = await self.db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        if (
            product.moderation_status != ProductModerationStatus.approved
            or not product.enabled
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is not available",
            )

        return product


    async def _get_favorite_by_id(
        self,
        current_user: UserModel,
        favorite_id: int,
    ) -> FavoriteItemModel:
        """
        Returns the current user's favorite item
        You cannot retrieve or delete another user's favorite item
        """

        query = (
            select(FavoriteItemModel)
            .options(*self._favorite_options())
            .where(
                FavoriteItemModel.id == favorite_id,
                FavoriteItemModel.user_id == current_user.id,
            )
        )

        result = await self.db.execute(query)
        favorite = result.scalar_one_or_none()

        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite item not found",
            )

        return favorite


    async def list_my_favorites(
        self,
        current_user: UserModel,
        pagination: PaginationParams,
    ) -> PaginationDTO[FavoriteItemModel]:
        """
        Returns the current user's selected items with pagination
        """

        query = (
            select(FavoriteItemModel)
            .options(*self._favorite_options())
            .where(FavoriteItemModel.user_id == current_user.id)
            .order_by(FavoriteItemModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def add_to_favorites(
        self,
        current_user: UserModel,
        schema: AddFavoriteDTO,
    ) -> FavoriteItemModel:
        """
        Adds the item to favorites
        If the item is already in favorites, returns the existing record
        """

        try:
            product = await self._get_available_product(schema.product_id)

            existing_result = await self.db.execute(
                select(FavoriteItemModel)
                .options(*self._favorite_options())
                .where(
                    FavoriteItemModel.user_id == current_user.id,
                    FavoriteItemModel.product_id == product.id,
                )
            )

            existing_favorite = existing_result.scalar_one_or_none()

            if existing_favorite:
                return existing_favorite

            favorite = FavoriteItemModel(
                user_id=current_user.id,
                product_id=product.id,
            )

            self.db.add(favorite)
            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is already in favorites",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not add product to favorites",
            ) from exc

        return await self._get_favorite_by_id(
            current_user=current_user,
            favorite_id=favorite.id,
        )


    async def remove_from_favorites(
        self,
        current_user: UserModel,
        favorite_id: int,
    ) -> None:
        """
        Removes the item from Favorites
        """

        try:
            favorite = await self._get_favorite_by_id(
                current_user=current_user,
                favorite_id=favorite_id,
            )

            await self.db.delete(favorite)
            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not remove product from favorites",
            ) from exc


    async def move_to_cart(
        self,
        current_user: UserModel,
        favorite_id: int,
        schema: MoveFavoriteToCartDTO,
    ):
        """
        Moves the item from the favorites to the cart
        """

        try:
            favorite = await self._get_favorite_by_id(
                current_user=current_user,
                favorite_id=favorite_id,
            )

            await self.cart_service.add_product_to_cart(
                current_user=current_user,
                product_id=favorite.product_id,
                quantity=schema.quantity,
                commit=False,
            )

            await self.db.delete(favorite)
            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not move favorite product to cart",
            ) from exc

        return await self.cart_service.get_my_cart(current_user)