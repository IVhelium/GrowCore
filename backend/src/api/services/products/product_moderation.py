from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from src.core.pagination import PaginationParams, PaginationService
from src.schemas.pagination import PaginationDTO
from src.core.constants import ProductModerationStatus
from src.api.services.notification import NotificationService
from src.models import CartItemModel, FavoriteItemModel, ProductModel, UserModel
from src.schemas import DeleteProductDTO, RejectProductDTO

from .product_base import ProductBaseService


class ProductModerationService(ProductBaseService):
    """
    Product Moderation Service
    Used by administrators to review pending products,
    and approve or reject their publication
    """

    def __init__(
        self,
        db: AsyncSession,
    ):
        super().__init__(db)

    async def _notify_product_owner(
        self,
        product: ProductModel,
        title: str,
        message: str,
    ) -> None:
        if product.store and product.store.user_id:
            await NotificationService(self.db).create(
                user_id=product.store.user_id,
                title=title,
                message=message,
            )


    async def list_pending_moderation(
        self,
        pagination: PaginationParams,
    ) -> PaginationDTO:
        """
        Returns a list of products awaiting moderation
        The list is sorted from oldest to newest
        """

        query = (
            select(ProductModel)
            .options(*self._product_options())
            .where(
                ProductModel.moderation_status
                == ProductModerationStatus.pending,
            )
            .order_by(ProductModel.created_at.asc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )


    async def list_admin_products(
        self,
        pagination: PaginationParams,
    ) -> PaginationDTO:
        query = (
            select(ProductModel)
            .options(*self._product_options())
            .order_by(ProductModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )


    async def approve_product(
        self,
        admin: UserModel,
        product_id: int,
    ) -> ProductModel:
        """
        Approves the product and makes it publicly available
        After approval, the product is set to `enabled=True`
        """

        product = await self._get_product(product_id)

        if product.moderation_status != ProductModerationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is not awaiting moderation",
            )

        # The product becomes publicly available only after it is approved
        product.moderation_status = ProductModerationStatus.approved
        product.enabled = product.quantity > 0
        product.rejection_reason = None
        product.moderated_at = datetime.utcnow()
        product.moderator_id = admin.id
        await self._notify_product_owner(
            product,
            "Product approved",
            f"Your product '{product.title}' was approved and is now visible in the catalog.",
        )

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not approve product",
            ) from exc

        return await self._get_product(product.id)


    async def reject_product(
        self,
        admin: UserModel,
        product_id: int,
        schema: RejectProductDTO,
    ) -> ProductModel:
        """
        Rejects the item and records the reason for rejection
        The seller will be able to correct the item and resubmit it for review
        """

        product = await self._get_product(product_id)

        if product.moderation_status != ProductModerationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is not awaiting moderation",
            )

        reason = schema.reason.strip()

        if not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Rejection reason cannot be empty",
            )

        # Rejected items are not removed. The seller will see the reason, correct the listing, and resubmit it.
        product.moderation_status = ProductModerationStatus.rejected
        product.enabled = False
        product.rejection_reason = reason
        product.moderated_at = datetime.utcnow()
        product.moderator_id = admin.id
        await self._notify_product_owner(
            product,
            "Product rejected",
            f"Your product '{product.title}' was rejected. Reason: {reason}",
        )

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not reject product",
            ) from exc

        return await self._get_product(product.id)


    async def block_product(
        self,
        admin: UserModel,
        product_id: int,
        schema: DeleteProductDTO,
    ) -> ProductModel:
        product = await self._get_product(product_id)
        reason = schema.reason.strip()

        product.enabled = False
        product.moderation_status = ProductModerationStatus.blocked
        product.deletion_reason = reason
        product.moderated_at = datetime.utcnow()
        product.moderator_id = admin.id
        await self._notify_product_owner(
            product,
            "Product blocked",
            f"Your product '{product.title}' was blocked. Reason: {reason}",
        )

        try:
            await self.db.execute(
                delete(CartItemModel)
                .where(CartItemModel.product_id == product.id)
            )
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not block product",
            ) from exc

        return await self._get_product(product.id)


    async def delete_product(
        self,
        admin: UserModel,
        product_id: int,
        schema: DeleteProductDTO,
    ) -> ProductModel:
        product = await self._get_product(product_id)
        reason = schema.reason.strip()

        product.enabled = False
        product.moderation_status = ProductModerationStatus.deleted
        product.deletion_reason = reason
        product.deleted_at = datetime.utcnow()
        product.deleted_by_id = admin.id
        await self._notify_product_owner(
            product,
            "Product deleted",
            f"Your product '{product.title}' was deleted by an administrator. Reason: {reason}",
        )

        try:
            await self.db.execute(
                delete(CartItemModel)
                .where(CartItemModel.product_id == product.id)
            )
            await self.db.execute(
                delete(FavoriteItemModel)
                .where(FavoriteItemModel.product_id == product.id)
            )
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete product",
            ) from exc

        return await self._get_product(product.id)
