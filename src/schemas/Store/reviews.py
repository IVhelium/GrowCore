from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
    user_id: "ReadUserDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)