from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import UUID

from schemas.Seller.stores import ReadStoreDTO
from schemas.Store.categories import ReadCategoryDTO


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
    price: Decimal = Decimal(10, 2)
    quantity: int
    category_id: int
    store_id: UUID

    model_config = ConfigDict(extra="forbid")
    

class ReadProductDTO(BaseModel):
    id: int
    title: str = Field(max_length=100)
    description: str
    price: Decimal = Decimal(10, 2)
    quantity: int
    enabled: bool
    rating_avg: Decimal = Decimal(3, 1)
    rating_count: int
    created_at: datetime
    images: list[ReadProductImageDTO] = []
    store: ReadStoreDTO
    category: ReadCategoryDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
