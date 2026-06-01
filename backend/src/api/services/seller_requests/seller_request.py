from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.core.constants import SellerRequestStatus
from src.models import SellerRequestModel, UserModel
from src.schemas import (
    CreateSellerRequestDTO,
    ResubmitSellerRequestDTO,
)

from .seller_request_base import SellerRequestBaseService


class SellerRequestService(SellerRequestBaseService):
    """
    Seller's Custom Order Service
    Responsibilities:
    - Creating orders
    - Viewing your orders
    - Resubmitting rejected orders
    """

    async def get_my_request(
        self,
        current_user: UserModel,
    ) -> SellerRequestModel:
        """
        Returns the current user's request
        """

        return await self._get_my_request(current_user)

    async def create_request(
        self,
        current_user: UserModel,
        schema: CreateSellerRequestDTO,
    ) -> SellerRequestModel:
        """
        Creates an application to become a seller
        If an application already exists, a new one is not created
        For rejected applications, use the resubmit endpoint
        """

        query = (
            select(SellerRequestModel)
            .where(SellerRequestModel.user_id == current_user.id)
        )

        try:
            result = await self.db.execute(query)
            existing_request = result.scalar_one_or_none()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not check existing seller request",
            ) from exc

        if existing_request:
            if existing_request.status == SellerRequestStatus.pending:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Seller request is already pending",
                )

            if existing_request.status == SellerRequestStatus.approved:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Seller request is already approved",
                )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Rejected request already exists. Use resubmit endpoint",
            )

        seller_request = SellerRequestModel(
            passport_id=schema.passport_id.strip(),
            full_name=schema.full_name.strip(),
            phone_number=schema.phone_number.strip(),
            country=schema.country.strip(),
            message=schema.message.strip(),
            status=SellerRequestStatus.pending,
            user_id=current_user.id,
        )

        try:
            self.db.add(seller_request)
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Passport ID or phone number already exists",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create seller request",
            ) from exc

        return await self._get_request_by_id(seller_request.id)


    async def resubmit_my_request(
        self,
        current_user: UserModel,
        schema: ResubmitSellerRequestDTO,
    ) -> SellerRequestModel:
        """
        Resubmits a rejected request for review
        The user can update some of the fields. After that, the request
        becomes pending again
        """

        seller_request = await self._get_my_request(current_user)

        if seller_request.status != SellerRequestStatus.rejected:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only rejected seller request can be resubmitted",
            )

        data = schema.model_dump(exclude_unset=True)

        if not data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No data provided for resubmit",
            )

        for field, value in data.items():
            if isinstance(value, str):
                value = value.strip()

                if not value:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"{field} cannot be empty",
                    )

            setattr(seller_request, field, value)

        seller_request.status = SellerRequestStatus.pending
        seller_request.rejection_reason = None
        seller_request.reviewed_at = None
        seller_request.reviewer_id = None

        try:
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Passport ID or phone number already exists",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not resubmit seller request",
            ) from exc

        return await self._get_request_by_id(seller_request.id)