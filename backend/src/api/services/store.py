from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models import StoreModel, UserModel, UserRoleModel
from src.schemas import UpdateStoreDTO


class StoreService:
    """
    Seller's Store Service
    """

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def _safe_rollback(self) -> None:
        """
        Safely rolls back the transaction after a database error
        """

        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass


    async def get_my_store(
        self,
        seller: UserModel,
    ) -> StoreModel:
        """
        Returns the current seller's store
        If the store is not found, returns a 404
        """

        query = (
            select(StoreModel)
            .options(
                selectinload(StoreModel.user)
                .selectinload(UserModel.roles)
                .selectinload(UserRoleModel.role)
            )
            .where(StoreModel.user_id == seller.id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load store",
            ) from exc

        store = result.scalar_one_or_none()

        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found",
            )

        return store


    async def update_my_store(
        self,
        seller: UserModel,
        schema: UpdateStoreDTO,
    ) -> StoreModel:
        """
        Refreshes the current seller's store
        Allows you to edit the name and description
        """

        store = await self.get_my_store(seller)

        data = schema.model_dump(exclude_unset=True)

        if not data:
            return store

        if "name" in data and data["name"] is not None:
            data["name"] = data["name"].strip()

            if not data["name"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Store name cannot be empty",
                )

        if "description" in data and data["description"] is not None:
            data["description"] = data["description"].strip()

        for field, value in data.items():
            setattr(store, field, value)

        try:
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Store update conflict",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update store",
            ) from exc

        return await self.get_my_store(seller)
