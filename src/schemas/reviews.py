from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

class CreateRiviewDTO(BaseModel):
    rating: Decimal = Field(default=0), Decimal(3, 1)
    comment: str | None = None


class ReviewDTO(BaseModel):
    id: int
    rating: Decimal = Decimal(3, 1)
    comment: str | None
    created_at: datetime
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)