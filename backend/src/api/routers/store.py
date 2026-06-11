from fastapi import APIRouter

from src.core.dependencies import (
    SellerDependency,
    StoreServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import PaginationDTO, ReadProductDTO, ReadStoreDTO, UpdateStoreDTO


router = APIRouter(
    prefix="/stores",
    tags=["Stores"],
)


@router.get(
    "/me",
    response_model=ReadStoreDTO,
)
async def get_my_store(
    seller: SellerDependency,
    store_service: StoreServiceDependency,
):
    return await store_service.get_my_store(seller)


@router.patch(
    "/me",
    response_model=ReadStoreDTO,
)
async def update_my_store(
    schema: UpdateStoreDTO,
    seller: SellerDependency,
    store_service: StoreServiceDependency,
):
    return await store_service.update_my_store(
        seller=seller,
        schema=schema,
    )


@router.get(
    "/user/{public_id}",
    response_model=ReadStoreDTO,
)
async def get_public_user_store(
    public_id: str,
    store_service: StoreServiceDependency,
):
    return await store_service.get_store_by_user_public_id(public_id)


@router.get(
    "/user/{public_id}/products",
    response_model=PaginationDTO[ReadProductDTO],
)
async def list_public_user_store_products(
    public_id: str,
    store_service: StoreServiceDependency,
    pagination: PaginationDependency,
):
    return await store_service.list_public_store_products(
        public_id=public_id,
        pagination=pagination,
    )
