from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.schemas.User.users import ShortUserDTO


# Review Create Schema
class CreateReviewDTO(BaseModel):
    rating: Decimal = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=2000)
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        clean_value = value.strip()

        if not clean_value:
            raise ValueError("Review comment cannot be empty")

        return clean_value


class CreateReviewReplyDTO(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)

    model_config = ConfigDict(extra="forbid")

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        clean_value = value.strip()

        if not clean_value:
            raise ValueError("Reply cannot be empty")

        return clean_value


# Review Read Schema
class ReadReviewDTO(BaseModel):
    id: int
    rating: Decimal | None = Field(default=None, ge=1, le=5)
    comment: str | None
    created_at: datetime
    parent_id: int | None = None
    user: ShortUserDTO | None

    model_config = ConfigDict(extra="forbid", from_attributes=True)
