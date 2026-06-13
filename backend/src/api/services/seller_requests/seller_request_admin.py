from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.core.constants import RoleStatus, SellerRequestStatus
from src.core.config import settings
from src.core.pagination import PaginationParams, PaginationService
from src.core.upload_policies import SELLER_DOCUMENT_POLICY
from src.api.services.notification import NotificationService
from src.models import (
    RoleModel,
    SellerRequestModel,
    StoreModel,
    UserModel,
    UserRoleModel,
)
from src.schemas import (
    PaginationDTO,
    RejectSellerRequestDTO,
)

from .seller_request_base import SellerRequestBaseService


class SellerRequestAdminService(SellerRequestBaseService):
    """
    Seller Request Management Service
    Responsibilities:
    - Viewing the request queue
    - Approving requests
    - Rejecting requests
    - Assigning the “seller” role
    - Creating a store after approval
    """

    def __init__(
        self,
        db,
        file_storage_service,
    ):
        super().__init__(db)
        self.file_storage_service = file_storage_service

    async def list_requests(
        self,
        request_status: SellerRequestStatus | None,
        pagination: PaginationParams,
    ) -> PaginationDTO:
        """
        Returns a list of seller requests for the administrator
        You can filter by status: pending, approved, rejected
        """

        query = (
            select(SellerRequestModel)
            .options(*self._request_options())
        )

        if request_status is not None:
            query = query.where(
                SellerRequestModel.status == request_status
            )

        query = query.order_by(SellerRequestModel.created_at.desc())

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def get_document_location(
        self,
        request_id: int,
    ) -> tuple[str, Path | str, str, str]:
        seller_request = await self._get_request_by_id(request_id)

        if not seller_request.document_storage_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller request document not found",
            )

        filename = seller_request.document_name or "seller-document.pdf"
        content_type = seller_request.document_content_type or "application/pdf"

        if settings.FILE_STORAGE_BACKEND == "cloudinary":
            return (
                "redirect",
                self.file_storage_service.private_file_url(
                    storage_key=seller_request.document_storage_key,
                    policy=SELLER_DOCUMENT_POLICY,
                ),
                filename,
                content_type,
            )

        return (
            "file",
            self.file_storage_service.private_file_path(
                storage_key=seller_request.document_storage_key,
                policy=SELLER_DOCUMENT_POLICY,
            ),
            filename,
            content_type,
        )


    async def approve_request(
        self,
        admin: UserModel,
        request_id: int,
    ) -> SellerRequestModel:
        """
        Approves the seller's application
        After approval:
        - The application is marked as “approved”
        - The user is assigned the “seller” role
        - A StoreModel is created if the store does not yet exist
        """

        seller_request = await self._get_request_by_id(request_id)

        if seller_request.status != SellerRequestStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seller request is already processed",
            )

        try:
            role_result = await self.db.execute(
                select(RoleModel)
                .where(RoleModel.role == RoleStatus.seller)
            )

            seller_role = role_result.scalar_one_or_none()

            if not seller_role:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Seller role is not configured",
                )

            relation_result = await self.db.execute(
                select(UserRoleModel)
                .where(
                    UserRoleModel.user_id == seller_request.user_id,
                    UserRoleModel.role_id == seller_role.id,
                )
            )

            existing_relation = relation_result.scalar_one_or_none()

            if not existing_relation:
                self.db.add(
                    UserRoleModel(
                        user_id=seller_request.user_id,
                        role_id=seller_role.id,
                    )
                )

            store_result = await self.db.execute(
                select(StoreModel)
                .where(StoreModel.user_id == seller_request.user_id)
            )

            existing_store = store_result.scalar_one_or_none()

            if not existing_store:
                self.db.add(
                    StoreModel(
                        user_id=seller_request.user_id,
                        name=f"{seller_request.user.username}'s store",
                        description=None,
                    )
                )

            seller_request.status = SellerRequestStatus.approved
            seller_request.rejection_reason = None
            seller_request.reviewed_at = datetime.utcnow()
            seller_request.reviewer_id = admin.id
            await NotificationService(self.db).create(
                user_id=seller_request.user_id,
                title="Seller request approved",
                message="Your seller request was approved. Your store is ready.",
            )

            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Could not assign seller role or create store",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not approve seller request",
            ) from exc

        return await self._get_request_by_id(seller_request.id)


    async def reject_request(
        self,
        admin: UserModel,
        request_id: int,
        schema: RejectSellerRequestDTO,
    ) -> SellerRequestModel:
        """
        Rejects the seller's application and records the reason for the rejection
        """

        seller_request = await self._get_request_by_id(request_id)

        if seller_request.status != SellerRequestStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seller request is already processed",
            )

        reason = schema.reason.strip()

        if not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Rejection reason cannot be empty",
            )

        seller_request.status = SellerRequestStatus.rejected
        seller_request.rejection_reason = reason
        seller_request.reviewed_at = datetime.utcnow()
        seller_request.reviewer_id = admin.id
        await NotificationService(self.db).create(
            user_id=seller_request.user_id,
            title="Seller request rejected",
            message=f"Your seller request was rejected. Reason: {reason}",
        )

        try:
            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not reject seller request",
            ) from exc

        return await self._get_request_by_id(seller_request.id)
