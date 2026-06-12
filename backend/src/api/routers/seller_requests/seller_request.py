from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

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
    current_user: CurrentUserDependency,
    seller_request_service: SellerRequestServiceDependency,
    passport_id: Annotated[str, Form(...)],
    full_name: Annotated[str, Form(...)],
    phone_number: Annotated[str, Form(...)],
    country: Annotated[str, Form(...)],
    message: Annotated[str, Form(...)],
    document: Annotated[UploadFile, File(...)],
):
    schema = CreateSellerRequestDTO(
        passport_id=passport_id,
        full_name=full_name,
        phone_number=phone_number,
        country=country,
        message=message,
    )

    return await seller_request_service.create_request(
        current_user=current_user,
        schema=schema,
        document=document,
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
    current_user: CurrentUserDependency,
    seller_request_service: SellerRequestServiceDependency,
    document: Annotated[UploadFile, File(...)],
    passport_id: Annotated[str | None, Form()] = None,
    full_name: Annotated[str | None, Form()] = None,
    phone_number: Annotated[str | None, Form()] = None,
    country: Annotated[str | None, Form()] = None,
    message: Annotated[str | None, Form()] = None,
):
    schema = ResubmitSellerRequestDTO(
        passport_id=passport_id,
        full_name=full_name,
        phone_number=phone_number,
        country=country,
        message=message,
    )

    return await seller_request_service.resubmit_my_request(
        current_user=current_user,
        schema=schema,
        document=document,
    )
