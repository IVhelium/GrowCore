from fastapi import APIRouter, Query
from fastapi.responses import FileResponse, RedirectResponse

from src.core.constants import SellerRequestStatus
from src.core.dependencies import (
    AdminDependency,
    SellerRequestAdminServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import (
    PaginationDTO,
    ReadSellerRequestDTO,
    RejectSellerRequestDTO,
)


router = APIRouter(
    prefix="/admin/seller-requests",
    tags=["Admin Seller Requests"],
)


@router.get(
    "",
    response_model=PaginationDTO[ReadSellerRequestDTO],
)
async def list_seller_requests(
    admin: AdminDependency,
    seller_request_admin_service: SellerRequestAdminServiceDependency,
    pagination: PaginationDependency,
    request_status: SellerRequestStatus | None = Query(default=None),
):
    return await seller_request_admin_service.list_requests(
        request_status=request_status,
        pagination=pagination,
    )


@router.get("/{request_id}/document")
async def open_seller_request_document(
    request_id: int,
    admin: AdminDependency,
    seller_request_admin_service: SellerRequestAdminServiceDependency,
):
    location_type, location, filename, content_type = (
        await seller_request_admin_service.get_document_location(request_id)
    )

    if location_type == "redirect":
        return RedirectResponse(str(location))

    return FileResponse(
        path=location,
        media_type=content_type,
        filename=filename,
        content_disposition_type="inline",
    )


@router.patch(
    "/{request_id}/approve",
    response_model=ReadSellerRequestDTO,
)
async def approve_seller_request(
    request_id: int,
    admin: AdminDependency,
    seller_request_admin_service: SellerRequestAdminServiceDependency,
):
    return await seller_request_admin_service.approve_request(
        admin=admin,
        request_id=request_id,
    )


@router.patch(
    "/{request_id}/reject",
    response_model=ReadSellerRequestDTO,
)
async def reject_seller_request(
    request_id: int,
    schema: RejectSellerRequestDTO,
    admin: AdminDependency,
    seller_request_admin_service: SellerRequestAdminServiceDependency,
):
    return await seller_request_admin_service.reject_request(
        admin=admin,
        request_id=request_id,
        schema=schema,
    )
