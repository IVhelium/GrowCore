from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import ProductModerationStatus
from src.models import CategoryModel, ProductModel, ReviewModel, StoreModel, UserModel


class ProductBaseService:
    """
    Basic Product Service
    """

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db


    async def _safe_rollback(self) -> None:
        """
        Safely rolls back the current transaction
        Used after commit/flush/execute errors to ensure that the database session
        does not remain in an inconsistent state
        """

        try:
            await self.db.rollback()

        except SQLAlchemyError:
            # The rollback may fail on its own if the connection to the database has already been lost
            pass


    @staticmethod
    def _product_options():
        return (
            selectinload(ProductModel.images),
            selectinload(ProductModel.category),
            selectinload(ProductModel.store).selectinload(StoreModel.user),
            selectinload(ProductModel.reviews)
            .selectinload(ReviewModel.user),
        )


    @staticmethod
    def _ensure_seller_active(
        seller: UserModel,
    ) -> None:
        if seller.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is blocked. Contact support to restore seller access.",
            )


    async def _get_seller_store(
        self,
        seller: UserModel,
    ) -> StoreModel:
        """
        Returns the current seller's store
        If the store is not found, returns a 404 error
        """

        query = (
            select(StoreModel)
            .options(selectinload(StoreModel.user))
            .where(StoreModel.user_id == seller.id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load seller store",
            ) from exc

        store = result.scalar_one_or_none()

        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller store not found",
            )

        if store.user and store.user.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seller store is blocked",
            )

        return store


    async def _check_category(
        self,
        category_id: int | None,
    ) -> None:
        """
        Checks if the category exists
        If category_id is None, the check is skipped
        """

        if category_id is None:
            return

        query = (
            select(CategoryModel)
            .where(CategoryModel.id == category_id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not check category",
            ) from exc

        category = result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )


    async def _get_product(
        self,
        product_id: int,
    ) -> ProductModel:
        """
        Returns the product by ID along with its associated data
        If the product is not found, returns a 404
        """

        query = (
            select(ProductModel)
            .options(*self._product_options())
            .execution_options(populate_existing=True)
            .where(ProductModel.id == product_id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load product",
            ) from exc

        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        return product


    async def _get_seller_product(
        self,
        seller: UserModel,
        product_id: int,
    ) -> ProductModel:
        """
        Returns the seller's product
        The method additionally verifies that the product belongs to the
        current seller's store
        """

        store = await self._get_seller_store(seller)

        query = (
            select(ProductModel)
            .options(*self._product_options())
            .execution_options(populate_existing=True)
            .where(
                ProductModel.id == product_id,
                ProductModel.store_id == store.id,
            )
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load seller product",
            ) from exc

        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in your store",
            )

        return product


    @staticmethod
    def _ensure_product_editable(
        product: ProductModel,
    ) -> None:
        """
        Checks whether a product can be edited
        Only products with the status “draft” or “rejected” can be edited
        """

        if product.moderation_status not in {
            ProductModerationStatus.draft,
            ProductModerationStatus.rejected,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only draft or rejected products can be edited",
            )


    @staticmethod
    def _reset_rejected_product_to_draft(
        product: ProductModel,
    ) -> None:
        """
        Returns a rejected item to the draft status after corrections have been made
        After that, the seller will be able to resubmit the item for moderation
        """

        if product.moderation_status != ProductModerationStatus.rejected:
            return

        product.moderation_status = ProductModerationStatus.draft
        product.rejection_reason = None
        product.moderated_at = None
        product.moderator_id = None


    @staticmethod
    def _send_product_to_moderation(
        product: ProductModel,
    ) -> None:
        """
        Sends a seller product back to moderation after public-facing changes.
        Quantity and description changes are applied without moderation.
        """

        product.moderation_status = ProductModerationStatus.pending
        product.enabled = False
        product.rejection_reason = None
        product.moderated_at = None
        product.moderator_id = None
