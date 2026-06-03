from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AddFavoriteDTO(BaseModel):
    product_id: int

    model_config = ConfigDict(extra="forbid")


class MoveFavoriteToCartDTO(BaseModel):
    quantity: int = Field(default=1, ge=1)

    model_config = ConfigDict(extra="forbid")


class ReadFavoriteProductImageDTO(BaseModel):
    id: int
    image: str

    model_config = ConfigDict(from_attributes=True)


class ReadFavoriteProductDTO(BaseModel):
    id: int
    title: str
    price: Decimal
    quantity: int
    enabled: bool

    images: list[ReadFavoriteProductImageDTO] = []

    model_config = ConfigDict(from_attributes=True)


class ReadFavoriteItemDTO(BaseModel):
    id: int
    created_at: datetime
    product: ReadFavoriteProductDTO

    model_config = ConfigDict(from_attributes=True)