from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from models.seller_requests import SellerRequestStatus

class CreateSellerRequestDTO(BaseModel):
    passport_id: str
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
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)