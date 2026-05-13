from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID


# Product Image Schemas
class BaseProductImageDTO(BaseModel):
    image: str

class CreateProductImageDTO(BaseProductImageDTO):
    product_id: int
    
    model_config = ConfigDict(extra="forbid")

class ReadProductImageDTO(BaseProductImageDTO):
    id: int
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
  
    
# Product Schemas
class CreateProductDTO(BaseModel):
    title: str = Field(max_length=100)
    description: str
    price: Decimal
    quantity: int
    category_id: int
    store_id: UUID

    model_config = ConfigDict(extra="forbid")
    

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
    images: list[ReadProductImageDTO] = []
    store: "ReadStoreDTO"
    category: "ReadCategoryDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
