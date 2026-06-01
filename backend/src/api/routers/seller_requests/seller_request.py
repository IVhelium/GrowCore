from fastapi import APIRouter

from src.core.dependencies import (
    CurrentUserDependency,
    SellerRequestServiceDependency,
)
from src.schemas import (
    CreateSellerRequestDTO,
    ReadSellerRequestDTO,
    ResubmitSellerRequestDTO,
)


router = APIRouter(
    prefix="/seller-requests",
    tags=["Seller Requests"],
)


@router.post(
    "",
    response_model=ReadSellerRequestDTO,
)
async def create_seller_request(
    schema: CreateSellerRequestDTO,
    current_user: CurrentUserDependency,
    seller_request_service: SellerRequestServiceDependency,
):
    return await seller_request_service.create_request(
        current_user=current_user,
        schema=schema,
    )


@router.get(
    "/me",
    response_model=ReadSellerRequestDTO,
)
async def get_my_seller_request(
    current_user: CurrentUserDependency,
    seller_request_service: SellerRequestServiceDependency,
):
    return await seller_request_service.get_my_request(
        current_user=current_user,
    )


@router.patch(
    "/me/resubmit",
    response_model=ReadSellerRequestDTO,
)
async def resubmit_my_seller_request(
    schema: ResubmitSellerRequestDTO,
    current_user: CurrentUserDependency,
    seller_request_service: SellerRequestServiceDependency,
):
    return await seller_request_service.resubmit_my_request(
        current_user=current_user,
        schema=schema,
    )