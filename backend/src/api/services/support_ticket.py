from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import RoleStatus, SupportTicketStatus
from src.core.pagination import PaginationParams, PaginationService
from src.models import SupportTicketModel, UserModel
from src.schemas import (
    CreateSupportTicketDTO,
    PaginationDTO,
    UpdateSupportTicketDTO,
)


class SupportTicketService:
    """
    Support Ticket Service

    Responsibilities:
    - Allowing users to create tickets
    - Allowing users to view their own tickets
    - Viewing the support/admin ticket queue
    - Assigning tickets to support agents
    - Responding to tickets and updating their status
    """

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db


    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass


    @staticmethod
    def _ticket_options():
        return (
            selectinload(SupportTicketModel.user),
            selectinload(SupportTicketModel.assigned_support),
        )


    @staticmethod
    def _has_role(
        user: UserModel,
        role: RoleStatus,
    ) -> bool:
        return any(
            relation.role.role == role
            for relation in user.roles
        )


    async def _get_ticket_by_id(
        self,
        ticket_id: int,
    ) -> SupportTicketModel:
        """
        Returns the request by ID
        If the request is not found, returns a 404
        """

        query = (
            select(SupportTicketModel)
            .options(*self._ticket_options())
            .where(SupportTicketModel.id == ticket_id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load support ticket",
            ) from exc

        ticket = result.scalar_one_or_none()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Support ticket not found",
            )

        return ticket


    def _ensure_can_work_with_ticket(
        self,
        support_user: UserModel,
        ticket: SupportTicketModel,
    ) -> None:
        """
        Checks whether support/admin can handle the request
        Admin can handle any request
        Support cannot modify a request assigned to another support agent
        """

        if self._has_role(support_user, RoleStatus.admin):
            return

        if (
            ticket.assigned_support_id is not None
            and ticket.assigned_support_id != support_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This ticket is assigned to another support user",
            )


    async def create_ticket(
        self,
        current_user: UserModel,
        schema: CreateSupportTicketDTO,
    ) -> SupportTicketModel:
        """
        Creates a support ticket on behalf of the current user
        """

        subject = schema.subject.strip()
        message = schema.message.strip()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Subject cannot be empty",
            )

        if not message:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Message cannot be empty",
            )

        ticket = SupportTicketModel(
            subject=subject,
            message=message,
            status=SupportTicketStatus.open,
            user_id=current_user.id,
        )

        try:
            self.db.add(ticket)
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create support ticket",
            ) from exc

        return await self._get_ticket_by_id(ticket.id)


    async def list_my_tickets(
        self,
        current_user: UserModel,
        pagination: PaginationParams,
    ) -> PaginationDTO[SupportTicketModel]:
        """
        Returns the current user's requests with pagination
        """

        query = (
            select(SupportTicketModel)
            .options(*self._ticket_options())
            .where(SupportTicketModel.user_id == current_user.id)
            .order_by(SupportTicketModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )


    async def list_tickets(
        self,
        ticket_status: SupportTicketStatus | None,
        pagination: PaginationParams,
    ) -> PaginationDTO[SupportTicketModel]:
        """
        Returns the queue of requests for support/admin
        You can filter by status: open, in_progress, resolved, closed
        """

        query = (
            select(SupportTicketModel)
            .options(*self._ticket_options())
        )

        if ticket_status is not None:
            query = query.where(
                SupportTicketModel.status == ticket_status
            )

        query = query.order_by(SupportTicketModel.created_at.asc())

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )


    async def assign_ticket(
        self,
        support_user: UserModel,
        ticket_id: int,
    ) -> SupportTicketModel:
        """
        Assigns a ticket to the user “support/admin”
        If the ticket is already closed or resolved, assignment is not allowed
        """

        ticket = await self._get_ticket_by_id(ticket_id)

        self._ensure_can_work_with_ticket(
            support_user=support_user,
            ticket=ticket,
        )

        if ticket.status in {
            SupportTicketStatus.resolved,
            SupportTicketStatus.closed,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Resolved or closed ticket cannot be assigned",
            )

        ticket.assigned_support_id = support_user.id
        ticket.status = SupportTicketStatus.in_progress

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not assign support ticket",
            ) from exc

        return await self._get_ticket_by_id(ticket.id)


    async def update_ticket(
        self,
        support_user: UserModel,
        ticket_id: int,
        schema: UpdateSupportTicketDTO,
    ) -> SupportTicketModel:
        """
        Updates the support/admin request by the user
        You can add a response and change the status
        """

        ticket = await self._get_ticket_by_id(ticket_id)

        self._ensure_can_work_with_ticket(
            support_user=support_user,
            ticket=ticket,
        )

        data = schema.model_dump(exclude_unset=True)

        if not data:
            return ticket

        if "response" in data and data["response"] is not None:
            response = data["response"].strip()

            if not response:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Response cannot be empty",
                )

            ticket.response = response

        if "status" in data and data["status"] is not None:
            ticket.status = data["status"]

            if ticket.status in {
                SupportTicketStatus.resolved,
                SupportTicketStatus.closed,
            }:
                ticket.resolved_at = datetime.now(timezone.utc)

            else:
                ticket.resolved_at = None

        if ticket.assigned_support_id is None:
            ticket.assigned_support_id = support_user.id

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update support ticket",
            ) from exc

        return await self._get_ticket_by_id(ticket.id)