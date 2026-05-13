from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from src.models.Seller.seller_requests import SellerRequestStatus


class BaseSellerRequestDTO(BaseModel):
    full_name: str
    phone_number: str
    country: str
    message: str
    
    model_config = ConfigDict(extra="forbid")


class CreateSellerRequestDTO(BaseSellerRequestDTO):
    passport_id: str = Field(max_length=10, min_length=8)
    


class ReadSellerRequestDTO(BaseSellerRequestDTO):
    id: int
    status: SellerRequestStatus
    created_at: datetime
    user_id: "ReadUserDTO"
    
    model_config = ConfigDict(from_attributes=True)