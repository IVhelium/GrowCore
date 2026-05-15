from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# Product Image Read Schema
class ReadProductImageDTO(BaseModel):
    id: int
    image: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
  
    
# Product Create Schemas
class CreateProductDTO(BaseModel):
    title: str = Field(max_length=100)
    description: str
    price: Decimal
    quantity: int
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
    rating_avg: Decimal
    rating_count: int
    created_at: datetime
    store: "ReadStoreDTO"
    category: "ReadCategoryDTO"
    images: list["ReadProductImageDTO"]
    reviews: list["ReadReviewDTO"]
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
