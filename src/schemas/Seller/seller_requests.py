from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from src.models.Seller.seller_requests import SellerRequestStatus


# Seller Request Create Schema
class CreateSellerRequestDTO(BaseModel):
    passport_id: str = Field(max_length=10, min_length=8)
    full_name: str
    phone_number: str
    country: str
    message: str
    
    model_config = ConfigDict(extra="forbid")
    

# Seller Request Read Schema
class ReadSellerRequestDTO(BaseModel):
    id: int
    passport_id: str
    full_name: str
    phone_number: str
    country: str
    message: str
    status: SellerRequestStatus
    created_at: datetime
    user_id: "ShortUserDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)