from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.pagination import PaginationDTO
from src.core.pagination import PaginationParams, PaginationService
from src.api.services.files.file_storage import FileStorageService
from src.core.constants import ProductModerationStatus
from src.core.upload_policies import PRODUCT_IMAGE_POLICY
from src.models import CartItemModel, FavoriteItemModel, ProductModel, ReviewModel, StoreModel, UserModel
from src.schemas import CreateProductDTO, CreateReviewDTO, CreateReviewReplyDTO, DeleteProductDTO, UpdateProductAvailabilityDTO, UpdateProductDTO
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

    @staticmethod
    def _clean_attributes(attributes: dict | None) -> dict[str, str]:
        if not attributes:
            return {}

        cleaned_attributes = {}

        for key, value in attributes.items():
            clean_key = str(key).strip()
            clean_value = str(value).strip()

            if clean_key and clean_value:
                cleaned_attributes[clean_key] = clean_value

        return cleaned_attributes

    async def create_draft(
        self,
        seller: UserModel,
        schema: CreateProductDTO,
    ) -> ProductModel:
        """
        Creates a draft product listing for the current seller
        After a flush, generates an image_storage_prefix for future product images
        """

        self._ensure_seller_active(seller)
        store = await self._get_seller_store(seller)

        await self._check_category(schema.category_id)

        product = ProductModel(
            title=schema.title.strip(),
            description=schema.description.strip(),
            price=schema.price,
            discount_percent=schema.discount_percent,
            discount_expires_at=schema.discount_expires_at,
            quantity=schema.quantity,
            attributes=self._clean_attributes(schema.attributes),
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

        self._ensure_seller_active(seller)
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

        self._ensure_seller_active(seller)
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

        self._ensure_seller_active(seller)
        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        if product.moderation_status in {
            ProductModerationStatus.blocked,
            ProductModerationStatus.deleted,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Blocked or deleted products cannot be edited",
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

        if "attributes" in data:
            data["attributes"] = self._clean_attributes(data["attributes"])

        next_quantity = data.get("quantity", product.quantity)

        if data.get("enabled") is True and next_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot enable a product with zero stock",
            )

        moderation_fields = {
            "title",
            "price",
            "discount_percent",
            "category_id",
            "attributes",
        }
        needs_moderation = False

        for field, value in data.items():
            if field in moderation_fields and getattr(product, field) != value:
                needs_moderation = True

            setattr(product, field, value)

        if "quantity" in data:
            if product.quantity <= 0:
                product.enabled = False
            elif (
                product.moderation_status == ProductModerationStatus.approved
                and "enabled" not in data
            ):
                product.enabled = True

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

        self._ensure_seller_active(seller)
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

        self._ensure_seller_active(seller)
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

        if schema.enabled and product.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot enable a product with zero stock",
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
        schema: DeleteProductDTO | None = None,
    ) -> None:
        """
        Safely removes a seller product from the public catalog.
        Published products are soft-deleted so historical orders stay intact.
        """

        self._ensure_seller_active(seller)
        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        reason = (schema.reason if schema else "Removed by seller").strip()

        if len(reason) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Deletion reason must be at least 10 characters",
            )

        product.enabled = False
        product.moderation_status = ProductModerationStatus.deleted
        product.deletion_reason = reason
        product.deleted_at = datetime.utcnow()
        product.deleted_by_id = seller.id

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

    async def list_public_products(
        self,
        search: str | None,
        category_id: int | None,
        pagination: PaginationParams,
        min_price=None,
        max_price=None,
        sellers: list[str] | None = None,
        availability: list[str] | None = None,
        labels: list[str] | None = None,
        attribute_filters: list[str] | None = None,
        sort: str = "new",
    ) -> PaginationDTO:
        """
        Returns the public product catalog
        Only products with the status “approved” and “enabled=True” are displayed
        Supports search, category filtering, and pagination
        """

        query = (
            select(ProductModel)
            .join(ProductModel.store)
            .join(StoreModel.user)
            .options(*self._product_options())
            .where(
                ProductModel.enabled.is_(True),
                ProductModel.moderation_status
                == ProductModerationStatus.approved,
                UserModel.is_blocked.is_(False),
            )
        )

        if category_id is not None:
            query = query.where(
                ProductModel.category_id == category_id,
            )

        if min_price is not None:
            query = query.where(ProductModel.price >= min_price)
        if max_price is not None:
            query = query.where(ProductModel.price <= max_price)
        if sellers:
            selected_sellers = [value for value in sellers if value != "__other__"]
            seller_conditions = []
            if selected_sellers:
                seller_conditions.append(StoreModel.name.in_(selected_sellers))
            if "__other__" in sellers:
                seller_conditions.append(StoreModel.show_in_filters.is_(False))
            if seller_conditions:
                query = query.where(or_(*seller_conditions))
        if labels:
            label_conditions = []
            if "Deal" in labels:
                label_conditions.append(ProductModel.discount_percent > 0)
            if "New" in labels:
                label_conditions.append(ProductModel.created_at >= datetime.utcnow() - timedelta(days=30))
            if "Hot" in labels:
                label_conditions.append(ProductModel.rating_avg >= 4)
            if "Popular" in labels:
                label_conditions.append(ProductModel.rating_count >= 10)
            if label_conditions:
                query = query.where(or_(*label_conditions))
        if availability:
            stock_conditions = []
            if "ready" in availability:
                stock_conditions.append(ProductModel.quantity > 0)
            if "out" in availability:
                stock_conditions.append(ProductModel.quantity <= 0)
            if stock_conditions:
                query = query.where(or_(*stock_conditions))
        parsed_attributes = {}
        for item in attribute_filters or []:
            if ":" not in item:
                continue
            name, value = item.split(":", 1)
            if name and value:
                parsed_attributes.setdefault(name, []).append(value)
        for name, values in parsed_attributes.items():
            query = query.where(ProductModel.attributes[name].as_string().in_(values))

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

        ordering = {
            "popular": ProductModel.rating_avg.desc(),
            "price-asc": ProductModel.price.asc(),
            "price-des": ProductModel.price.desc(),
            "random": func.random(),
        }.get(sort, ProductModel.created_at.desc())
        query = query.order_by(ordering, ProductModel.id.desc())

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
            or product.store.user.is_blocked
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        return product

    async def create_review(
        self,
        current_user: UserModel,
        product_id: int,
        schema: CreateReviewDTO,
    ) -> ProductModel:
        product = await self.get_public_product(product_id)

        existing_review_query = (
            select(ReviewModel)
            .where(
                ReviewModel.product_id == product.id,
                ReviewModel.user_id == current_user.id,
                ReviewModel.parent_id.is_(None),
                ReviewModel.rating.is_not(None),
            )
        )

        try:
            existing_review = (
                await self.db.execute(existing_review_query)
            ).scalar_one_or_none()
        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not check review",
            ) from exc

        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already reviewed this product",
            )

        review = ReviewModel(
            user_id=current_user.id,
            product_id=product.id,
            rating=schema.rating,
            comment=schema.comment.strip() or None,
        )

        total_rating = product.rating_avg * product.rating_count + schema.rating
        product.rating_count += 1
        product.rating_avg = total_rating / product.rating_count

        try:
            self.db.add(review)
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create review",
            ) from exc

        return await self._get_product(product.id)

    async def create_review_reply(
        self,
        current_user: UserModel,
        product_id: int,
        review_id: int,
        schema: CreateReviewReplyDTO,
    ) -> ProductModel:
        product = await self.get_public_product(product_id)

        parent_review_query = (
            select(ReviewModel)
            .where(
                ReviewModel.id == review_id,
                ReviewModel.product_id == product.id,
            )
        )

        try:
            parent_review = (
                await self.db.execute(parent_review_query)
            ).scalar_one_or_none()
        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load review",
            ) from exc

        if not parent_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        if parent_review.parent_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Replies can only be added to rated reviews",
            )

        reply = ReviewModel(
            user_id=current_user.id,
            product_id=product.id,
            parent_id=parent_review.id,
            rating=None,
            comment=schema.comment.strip(),
        )

        try:
            self.db.add(reply)
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create reply",
            ) from exc

        return await self._get_product(product.id)
