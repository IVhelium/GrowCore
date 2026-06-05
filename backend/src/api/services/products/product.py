from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.pagination import PaginationDTO
from src.core.pagination import PaginationParams, PaginationService
from src.api.services.files.file_storage import FileStorageService
from src.core.constants import ProductModerationStatus
from src.core.upload_policies import PRODUCT_IMAGE_POLICY
from src.models import ProductModel, UserModel
from src.schemas import CreateProductDTO, UpdateProductAvailabilityDTO, UpdateProductDTO
from src.utils.storage_paths import product_images_directory_key, seller_products_directory_key
from .product_base import ProductBaseService


class ProductService(ProductBaseService):
    """
    Main Product Service
    Responsible for creating, editing, submitting for moderation,
    managing product availability, and maintaining the public catalog
    """

    def __init__(
        self,
        db: AsyncSession,
        file_storage_service: FileStorageService,
    ):
        super().__init__(db)    # Passes the DB variable to the derived class
        self.file_storage_service = file_storage_service

    async def create_draft(
        self,
        seller: UserModel,
        schema: CreateProductDTO,
    ) -> ProductModel:
        """
        Creates a draft product listing for the current seller
        After a flush, generates an image_storage_prefix for future product images
        """

        store = await self._get_seller_store(seller)

        await self._check_category(schema.category_id)

        product = ProductModel(
            title=schema.title.strip(),
            description=schema.description.strip(),
            price=schema.price,
            quantity=schema.quantity,
            category_id=schema.category_id,
            store_id=store.id,
            enabled=False,
            moderation_status=ProductModerationStatus.draft,
        )

        try:
            self.db.add(product)

            await self.db.flush()

            seller_directory_key = seller_products_directory_key(seller)

            product.image_storage_prefix = product_images_directory_key(
                seller_directory_key=seller_directory_key,
                product_id=product.id,
            )

            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create product",
            ) from exc

        return await self._get_product(product.id)

    async def list_seller_products(
        self,
        seller: UserModel,
        pagination: PaginationParams,
    ) -> PaginationDTO:
        """
        Returns the products from the current seller's store, paginated
        """

        store = await self._get_seller_store(seller)

        query = (
            select(ProductModel)
            .options(*self._product_options())
            .where(ProductModel.store_id == store.id)
            .order_by(ProductModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def get_seller_product(
        self,
        seller: UserModel,
        product_id: int,
    ) -> ProductModel:
        """
        Returns a specific product from the current seller
        """

        return await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

    async def update_product(
        self,
        seller: UserModel,
        product_id: int,
        schema: UpdateProductDTO,
    ) -> ProductModel:
        """
        Updates any seller product.
        Quantity and description changes are applied immediately.
        Public-facing changes are sent to moderation.
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        data = schema.model_dump(exclude_unset=True)

        if not data:
            return await self._get_product(product.id)

        if "category_id" in data:
            await self._check_category(data["category_id"])

        if "title" in data and data["title"] is not None:
            data["title"] = data["title"].strip()

            if not data["title"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Product title cannot be empty",
                )

        if "description" in data and data["description"] is not None:
            data["description"] = data["description"].strip()

            if not data["description"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Product description cannot be empty",
                )

        moderation_fields = {
            "title",
            "price",
            "category_id",
        }
        needs_moderation = False

        for field, value in data.items():
            if field in moderation_fields and getattr(product, field) != value:
                needs_moderation = True

            setattr(product, field, value)

        if needs_moderation:
            self._send_product_to_moderation(product)

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update product",
            ) from exc

        return await self._get_product(product.id)

    async def submit_for_moderation(
        self,
        seller: UserModel,
        product_id: int,
    ) -> ProductModel:
        """
        Submits draft/rejected products for moderation
        The product must have at least one image
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        if product.moderation_status not in {
            ProductModerationStatus.draft,
            ProductModerationStatus.rejected,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product cannot be submitted for moderation now",
            )

        if not product.images:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Add at least one product image before submission",
            )

        product.moderation_status = ProductModerationStatus.pending
        product.enabled = False
        product.rejection_reason = None
        product.moderated_at = None
        product.moderator_id = None

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not submit product for moderation",
            ) from exc

        return await self._get_product(product.id)

    async def update_availability(
        self,
        seller: UserModel,
        product_id: int,
        schema: UpdateProductAvailabilityDTO,
    ) -> ProductModel:
        """
        Toggles the published product's status
        You can only change the availability of approved products
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        # Sellers can only enable or disable items that have already been approved
        # Drafts, rejected, and pending items should not be visible
        if product.moderation_status != ProductModerationStatus.approved:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only approved products can change availability",
            )

        product.enabled = schema.enabled

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update product availability",
            ) from exc

        return await self._get_product(product.id)

    async def delete_unpublished_product(
        self,
        seller: UserModel,
        product_id: int,
    ) -> None:
        """
        Deletes the seller's unpublished product
        Only draft or rejected products can be deleted
        Image files are deleted from the database after successful delet
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )
        
        if product.moderation_status in {
            ProductModerationStatus.pending,
            ProductModerationStatus.approved,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pending or approved product cannot be deleted",
            )

        image_urls = [
            image.image
            for image in product.images
        ]

        try:
            await self.db.delete(product)
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete product",
            ) from exc

        # Delete files only after they have been successfully saved
        for image_url in image_urls:
            self.file_storage_service.delete_by_public_url(
                public_url=image_url,
                policy=PRODUCT_IMAGE_POLICY,
            )

    async def list_public_products(
        self,
        search: str | None,
        category_id: int | None,
        pagination: PaginationParams,
    ) -> PaginationDTO:
        """
        Returns the public product catalog
        Only products with the status “approved” and “enabled=True” are displayed
        Supports search, category filtering, and pagination
        """

        query = (
            select(ProductModel)
            .options(*self._product_options())
            .where(
                ProductModel.enabled.is_(True),
                ProductModel.moderation_status
                == ProductModerationStatus.approved,
            )
        )

        if category_id is not None:
            query = query.where(
                ProductModel.category_id == category_id,
            )

        if search:
            search_value = search.strip()

            if search_value:
                pattern = f"%{search_value}%"

                query = query.where(
                    or_(
                        ProductModel.title.ilike(pattern),
                        ProductModel.description.ilike(pattern),
                    )
                )

        query = query.order_by(ProductModel.created_at.desc())

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def get_public_product(
        self,
        product_id: int,
    ) -> ProductModel:
        """
        Returns the product's public card
        Products that are not approved or disabled are hidden as 404 errors
        """

        product = await self._get_product(product_id)
        
        if (
            product.moderation_status != ProductModerationStatus.approved
            or not product.enabled
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        return product
