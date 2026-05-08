from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.User.users import ReadUserDTO

class BaseReviewDTO(BaseModel):
    rating: Decimal = Field(ge=1, le=5), Decimal(3, 1)
    comment: str | None = None

class CreateReviewDTO(BaseReviewDTO):
    product_id: int
    
    model_config = ConfigDict(extra="forbid")

class ReadReviewDTO(BaseReviewDTO):
    id: int
    created_at: datetime
    user_id: ReadUserDTO
    product_id: int
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)