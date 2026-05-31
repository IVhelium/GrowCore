from typing import Annotated, Any

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.pagination import PaginationDTO


class PaginationParams:
    """
    A dependency class for retrieving pagination parameters from query parameters
    Ex: GET /products?limit=20&offset=40
    """

    def __init__(
        self,
        limit: int = Query(default=20, ge=1, le=100),
        offset: int = Query(default=0, ge=0),
    ):
        """
        Initializes pagination parameters
        limit: The maximum number of items per page
        offset: The number of items to skip
        """

        self.limit = limit
        self.offset = offset


PaginationDependency = Annotated[
    PaginationParams,
    Depends(),
]


class PaginationService:
    @staticmethod
    async def paginate(
        *,
        db: AsyncSession,
        query: Select,
        pagination: PaginationParams,
    ) -> PaginationDTO[Any]:
        """
        Implements pagination for an SQLAlchemy query
        First, it calculates the total using a separate `count` query,
        then executes the main query with `limit` and `offset`.
        """

        try:
            """
            Calculate the total separately from the main query
            For the count, we remove the limit, offset, and order_by clauses,
            then wrap the query in a subquery
            """
            count_query = select(func.count()).select_from(
                query
                .order_by(None)
                .limit(None)
                .offset(None)
                .subquery()
            )

            total = await db.scalar(count_query)

            # The main request retrieves only the current page
            result = await db.execute(
                query
                .limit(pagination.limit)
                .offset(pagination.offset)
            )

            items = list(result.scalars().unique().all())

        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Pagination query failed",
            ) from exc

        return PaginationDTO.create(
            items=items,
            total=total or 0,
            limit=pagination.limit,
            offset=pagination.offset,
        )