from typing import Annotated

from fastapi import APIRouter, File, Query, Response, UploadFile, status

from src.core.dependencies import (
    AdminDependency,
    CurrentUserDependency,
    ProductImageServiceDependency,
    ProductModerationServiceDependency,
    ProductServiceDependency,
    SellerDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import (
    CreateProductDTO,
    DeleteProductDTO,
    CreateReviewDTO,
    PaginationDTO,
    ReadProductDTO,
    RejectProductDTO,
    UpdateProductAvailabilityDTO,
    UpdateProductDTO,
)


router = APIRouter(tags=["Products"])


@router.get(
    "/products",
    response_model=PaginationDTO[ReadProductDTO],
)
async def list_public_products(
    product_service: ProductServiceDependency,
    pagination: PaginationDependency,
    search: str | None = Query(default=None, max_length=100),
    category_id: int | None = Query(default=None),
):
    """
    Returns the public product catalog
    Available to all users
    Displays only approved and enabled products
    """

    return await product_service.list_public_products(
        search=search,
        category_id=category_id,
        pagination=pagination,
    )


@router.get(
    "/products/{product_id}",
    response_model=ReadProductDTO,
)
async def get_public_product(
    product_id: int,
    product_service: ProductServiceDependency,
):
    """
    Returns the product's public card
    """

    return await product_service.get_public_product(product_id)


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReadProductDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_review(
    product_id: int,
    dto: CreateReviewDTO,
    current_user: CurrentUserDependency,
    product_service: ProductServiceDependency,
):
    """
    Adds a buyer review with rating to a public product
    """

    return await product_service.create_review(
        current_user=current_user,
        product_id=product_id,
        schema=dto,
    )


@router.post(
    "/seller/products",
    response_model=ReadProductDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_draft(
    dto: CreateProductDTO,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Creates a draft product listing for the current seller
    """

    return await product_service.create_draft(
        seller=seller,
        schema=dto,
    )


@router.get(
    "/seller/products",
    response_model=PaginationDTO[ReadProductDTO],
)
async def list_my_products(
    seller: SellerDependency,
    product_service: ProductServiceDependency,
    pagination: PaginationDependency,
):
    """
    Returns products from the current seller with pagination
    """

    return await product_service.list_seller_products(
        seller=seller,
        pagination=pagination,
    )


@router.get(
    "/seller/products/{product_id}",
    response_model=ReadProductDTO,
)
async def get_my_product(
    product_id: int,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Returns a specific product from the current seller
    """

    return await product_service.get_seller_product(
        seller=seller,
        product_id=product_id,
    )


@router.patch(
    "/seller/products/{product_id}",
    response_model=ReadProductDTO,
)
async def update_my_product(
    product_id: int,
    dto: UpdateProductDTO,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Updates the draft or rejected items for the current seller
    """

    return await product_service.update_product(
        seller=seller,
        product_id=product_id,
        schema=dto,
    )


@router.post(
    "/seller/products/{product_id}/submit",
    response_model=ReadProductDTO,
)
async def submit_product_for_moderation(
    product_id: int,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Submits the seller's product for review
    """

    return await product_service.submit_for_moderation(
        seller=seller,
        product_id=product_id,
    )


@router.patch(
    "/seller/products/{product_id}/availability",
    response_model=ReadProductDTO,
)
async def update_product_availability(
    product_id: int,
    dto: UpdateProductAvailabilityDTO,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Enables or disables the seller's listed item
    """

    return await product_service.update_availability(
        seller=seller,
        product_id=product_id,
        schema=dto,
    )


@router.delete(
    "/seller/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_unpublished_product(
    product_id: int,
    dto: DeleteProductDTO,
    seller: SellerDependency,
    product_service: ProductServiceDependency,
):
    """
    Removes the seller's unlisted item
    """

    await product_service.delete_unpublished_product(
        seller=seller,
        product_id=product_id,
        schema=dto,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/admin/products",
    response_model=PaginationDTO[ReadProductDTO],
)
async def list_admin_products(
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
    pagination: PaginationDependency,
):
    return await product_moderation_service.list_admin_products(
        pagination=pagination,
    )


@router.post(
    "/seller/products/{product_id}/images",
    response_model=ReadProductDTO,
)
async def upload_product_image(
    product_id: int,
    seller: SellerDependency,
    product_image_service: ProductImageServiceDependency,
    image: Annotated[UploadFile, File(...)],
):
    """
    Uploads an image for the seller's product
    """

    return await product_image_service.add_product_image(
        seller=seller,
        product_id=product_id,
        image=image,
    )


@router.delete(
    "/seller/products/{product_id}/images/{image_id}",
    response_model=ReadProductDTO,
)
async def delete_product_image(
    product_id: int,
    image_id: int,
    seller: SellerDependency,
    product_image_service: ProductImageServiceDependency,
):
    """
    Removes the seller's product image
    """

    return await product_image_service.delete_product_image(
        seller=seller,
        product_id=product_id,
        image_id=image_id,
    )


@router.get(
    "/admin/products/moderation",
    response_model=PaginationDTO[ReadProductDTO],
)
async def list_pending_products(
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
    pagination: PaginationDependency,
):
    """
    Returns a list of products awaiting moderation
    """

    return await product_moderation_service.list_pending_moderation(
        pagination=pagination,
    )


@router.patch(
    "/admin/products/moderation/{product_id}/approve",
    response_model=ReadProductDTO,
)
async def approve_product(
    product_id: int,
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
):
    """
    Approves the product and publishes it in the catalog
    """

    return await product_moderation_service.approve_product(
        admin=admin,
        product_id=product_id,
    )


@router.patch(
    "/admin/products/moderation/{product_id}/reject",
    response_model=ReadProductDTO,
)
async def reject_product(
    product_id: int,
    dto: RejectProductDTO,
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
):
    """
    Rejects the item and records the reason for rejection
    """

    return await product_moderation_service.reject_product(
        admin=admin,
        product_id=product_id,
        schema=dto,
    )


@router.patch(
    "/admin/products/{product_id}/block",
    response_model=ReadProductDTO,
)
async def block_product(
    product_id: int,
    dto: DeleteProductDTO,
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
):
    return await product_moderation_service.block_product(
        admin=admin,
        product_id=product_id,
        schema=dto,
    )


@router.delete(
    "/admin/products/{product_id}",
    response_model=ReadProductDTO,
)
async def delete_product(
    product_id: int,
    dto: DeleteProductDTO,
    admin: AdminDependency,
    product_moderation_service: ProductModerationServiceDependency,
):
    return await product_moderation_service.delete_product(
        admin=admin,
        product_id=product_id,
        schema=dto,
    )
