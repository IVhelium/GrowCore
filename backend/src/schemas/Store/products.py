from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.core.constants import ProductModerationStatus


# Product Image Read Schema
class ReadProductImageDTO(BaseModel):
    id: int
    image: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
class ReadProductCategoryDTO(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
class ReadProductStoreDTO(BaseModel):
    id: UUID
    name: str
    desription: str | None = None
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
  
    
# Product Create Schemas
class CreateProductDTO(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)
    price: Decimal = Field(ge=0)
    quantity: int = Field(ge=0)
    category_id: int

    model_config = ConfigDict(extra="forbid")
    

# Product Update Schema
class UpdateProductDTO(BaseModel):
    title: str | None
    description: str | None
    price: Decimal | None
    quantity: int | None
    enabled: bool | None
    category_id: int | None
    
    model_config = ConfigDict(extra="forbid")
    
    
class UpdateProductAvailabilityDTO(BaseModel):
    enabled: bool
    
    model_config = ConfigDict(extra="forbid")
 
 
class RejectProductDTO(BaseModel):
    reason: str = Field(min_length=10)
    
    model_config = ConfigDict(extra="forbid") 
    
    
# Product Short Schema
class ShortProductDTO(BaseModel):
    id: int
    title: str
    price: Decimal
    rating_avg: Decimal
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    

# Product Read Schema
class ReadProductDTO(BaseModel):
    id: int
    title: str = Field(max_length=100)
    description: str
    
    price: Decimal
    quantity: int
    
    enabled: bool
    moderation_status: ProductModerationStatus
    rejection_reason: str | None = None
    
    rating_avg: Decimal
    rating_count: int
    
    created_at: datetime
    moderated_at: datetime | None = None
    
    store: "ReadProductStoreDTO"
    category: "ReadProductCategoryDTO"
    images: list["ReadProductImageDTO"]
    reviews: list["ReadReviewDTO"]
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)   
