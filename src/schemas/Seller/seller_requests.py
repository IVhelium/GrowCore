from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from models.Seller.seller_requests import SellerRequestStatus

class CreateSellerRequestDTO(BaseModel):
    passport_id: str = Field(max_length=10, min_length=8)
    full_name: str
    phone_number: str
    country: str
    message: str
    
    model_config = ConfigDict(extra="forbid")


class SellerRequestDTO(BaseModel):
    id: int
    full_name: str
    phone_number: str
    country: str
    message: str
    status: SellerRequestStatus
    created_at: datetime
    user_id: UUID
    
    model_config = ConfigDict(from_attributes=True)