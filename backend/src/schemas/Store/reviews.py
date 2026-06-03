from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from src.schemas.User.users import ShortUserDTO


# Review Create Schema
class CreateReviewDTO(BaseModel):
    rating: Decimal = Field(ge=1, le=5)
    comment: str
    
    model_config = ConfigDict(extra="forbid")


# Review Read Schema
class ReadReviewDTO(BaseModel):
    id: int
    rating: Decimal = Field(ge=1, le=5)
    comment: str | None
    created_at: datetime
    user: ShortUserDTO | None

    model_config = ConfigDict(extra="forbid", from_attributes=True)
