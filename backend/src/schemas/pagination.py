from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


class PaginationDTO(BaseModel, Generic[T]):
    """
    A universal DTO schema for paginated responses.

    Used for lists of products, orders, inquiries, and any other entities
    where items need to be returned along with the total, limit, and offset.
    """
    
    items: list[T]

    total: int
    limit: int
    offset: int

    has_next: bool
    has_previous: bool

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def create(
        cls,
        *,
        items: list[T],
        total: int,
        limit: int,
        offset: int,
    ):
        """
        Creates a pagination object and automatically determines 
        whether there is a next or previous page
        """
        return cls(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_next=offset + limit < total,
            has_previous=offset > 0,
        )