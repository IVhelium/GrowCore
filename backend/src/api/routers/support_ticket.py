from fastapi import APIRouter, Query

from src.core.constants import SupportTicketStatus
from src.core.dependencies import (
    CurrentUserDependency,
    SupportOrAdminDependency,
    SupportTicketServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import (
    CreateSupportTicketDTO,
    PaginationDTO,
    ReadSupportTicketDTO,
    UpdateSupportTicketDTO,
)


router = APIRouter(
    prefix="/support/tickets",
    tags=["Support Tickets"],
)


@router.post(
    "",
    response_model=ReadSupportTicketDTO,
)
async def create_support_ticket(
    schema: CreateSupportTicketDTO,
    current_user: CurrentUserDependency,
    support_ticket_service: SupportTicketServiceDependency,
):
    return await support_ticket_service.create_ticket(
        current_user=current_user,
        schema=schema,
    )


@router.get(
    "/me",
    response_model=PaginationDTO[ReadSupportTicketDTO],
)
async def list_my_support_tickets(
    current_user: CurrentUserDependency,
    support_ticket_service: SupportTicketServiceDependency,
    pagination: PaginationDependency,
):
    return await support_ticket_service.list_my_tickets(
        current_user=current_user,
        pagination=pagination,
    )


@router.get(
    "",
    response_model=PaginationDTO[ReadSupportTicketDTO],
)
async def list_support_tickets(
    support_user: SupportOrAdminDependency,
    support_ticket_service: SupportTicketServiceDependency,
    pagination: PaginationDependency,
    ticket_status: SupportTicketStatus | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
):
    return await support_ticket_service.list_tickets(
        ticket_status=ticket_status,
        pagination=pagination,
        search=search,
    )


@router.patch(
    "/{ticket_id}/assign",
    response_model=ReadSupportTicketDTO,
)
async def assign_support_ticket(
    ticket_id: int,
    support_user: SupportOrAdminDependency,
    support_ticket_service: SupportTicketServiceDependency,
):
    return await support_ticket_service.assign_ticket(
        support_user=support_user,
        ticket_id=ticket_id,
    )


@router.patch(
    "/{ticket_id}",
    response_model=ReadSupportTicketDTO,
)
async def update_support_ticket(
    ticket_id: int,
    schema: UpdateSupportTicketDTO,
    support_user: SupportOrAdminDependency,
    support_ticket_service: SupportTicketServiceDependency,
):
    return await support_ticket_service.update_ticket(
        support_user=support_user,
        ticket_id=ticket_id,
        schema=schema,
    )
