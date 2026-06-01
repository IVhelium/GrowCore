from fastapi import APIRouter

from src.core.dependencies import (
    SellerDependency,
    StoreServiceDependency,
)
from src.schemas import ReadStoreDTO, UpdateStoreDTO


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