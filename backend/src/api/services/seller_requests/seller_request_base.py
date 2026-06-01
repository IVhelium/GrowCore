from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models import SellerRequestModel, UserModel


class SellerRequestBaseService:
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
    def _request_options():
        """
        Returns options for loading the users associated with the request
        user: the user who submitted the request
        reviewed_by: the administrator who reviewed the request
        """

        return (
            selectinload(SellerRequestModel.user),
            selectinload(SellerRequestModel.reviewed_by),
        )


    async def _get_request_by_id(
        self,
        request_id: int,
    ) -> SellerRequestModel:
        """
        Returns the seller's listing by ID
        If the listing is not found, returns a 404
        """

        query = (
            select(SellerRequestModel)
            .options(*self._request_options())
            .where(SellerRequestModel.id == request_id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load seller request",
            ) from exc

        seller_request = result.scalar_one_or_none()

        if not seller_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller request not found",
            )

        return seller_request


    async def _get_my_request(
        self,
        current_user: UserModel,
    ) -> SellerRequestModel:
        """
        Returns the current user's request
        A user can have only one request, because
        SellerRequestModel.user_id must be set to unique=True
        """

        query = (
            select(SellerRequestModel)
            .options(*self._request_options())
            .where(SellerRequestModel.user_id == current_user.id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load your seller request",
            ) from exc

        seller_request = result.scalar_one_or_none()

        if not seller_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller request not found",
            )

        return seller_request