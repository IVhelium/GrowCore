from fastapi import HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.services.files.file_storage import FileStorageService
from src.core.constants import ProductModerationStatus
from src.core.upload_policies import PRODUCT_IMAGE_POLICY
from src.models import ProductImageModel, ProductModel, UserModel

from .product_base import ProductBaseService


class ProductImageService(ProductBaseService):
    """
    Product Image Service
    Responsible for uploading and deleting a seller's product images
    """

    def __init__(
        self,
        db: AsyncSession,
        file_storage_service: FileStorageService,
    ):
        super().__init__(db)
        self.file_storage_service = file_storage_service


    async def add_product_image(
        self,
        seller: UserModel,
        product_id: int,
        image: UploadFile,
    ) -> ProductModel:
        """
        Adds an image to the seller's product
        First saves the file to disk, then creates a ProductImageModel record
        If the database record is not saved, the file is deleted
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        if not product.image_storage_prefix:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Product image directory is not configured",
            )

        # First, the file is saved to disk
        # If the database later fails to save the ProductImageModel,
        # this file will need to be deleted manually in the except block
        stored_file = await self.file_storage_service.save_file(
            file=image,
            policy=PRODUCT_IMAGE_POLICY,
            directory_key=product.image_storage_prefix,
        )

        if stored_file.public_url is None:
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=PRODUCT_IMAGE_POLICY,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Product image public URL is not configured",
            )

        product_image = ProductImageModel(
            product_id=product.id,
            image=stored_file.public_url,
        )

        self.db.add(product_image)

        if product.moderation_status == ProductModerationStatus.approved:
            self._send_product_to_moderation(product)
        else:
            self._reset_rejected_product_to_draft(product)

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=PRODUCT_IMAGE_POLICY,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Product image was saved, but database update failed",
            ) from exc

        return await self._get_product(product.id)


    async def delete_product_image(
        self,
        seller: UserModel,
        product_id: int,
        image_id: int,
    ) -> ProductModel:
        """
        Deletes the seller's product image
        First deletes the record from the database, then deletes the physical file
        """

        product = await self._get_seller_product(
            seller=seller,
            product_id=product_id,
        )

        product_image = next(
            (
                image
                for image in product.images
                if image.id == image_id
            ),
            None,
        )

        if product_image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product image not found",
            )

        old_image_url = product_image.image

        await self.db.delete(product_image)

        if product.moderation_status == ProductModerationStatus.approved:
            self._send_product_to_moderation(product)
        else:
            self._reset_rejected_product_to_draft(product)

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Product image delete failed",
            ) from exc

        self.file_storage_service.delete_by_public_url(
            public_url=old_image_url,
            policy=PRODUCT_IMAGE_POLICY,
        )

        return await self._get_product(product.id)
