from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from src.core.constants import SellerRequestStatus


# Seller Request Create Schema
class CreateSellerRequestDTO(BaseModel):
    passport_id: str = Field(min_length=8, max_length=10)
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
    rejection_reason: str | None = None
    
    created_at: datetime
    reviewed_reason: datetime | None = None
    
    user_id: "ShortUserDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
# Resubmit Seller Request Schema
class ResubmitSellerRequestDTO(BaseModel):
    passport_id: str | None = Field(min_length=8, max_length=10)
    full_name: str | None
    phone_number: str | None
    country: str | None
    message: str | None
    
    model_config = ConfigDict(extra="forbid")
    
    
# Reject Seller Request Schema
class RejectSellerRequestDTO(BaseModel):
    reason: str = Field(min_length=10)
    
    model_config = ConfigDict(extra="forbid")