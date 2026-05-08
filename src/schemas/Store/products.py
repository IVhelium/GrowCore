from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from schemas.Seller.stores import StoreDTO
from schemas.Store.categories import CategoryDTO


# Product Image Schemas
class ProductImageDTO(BaseModel):
    id: int
    image: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
  
    
# Product Schemas
class CreateProductDTO(BaseModel):
    title: str = Field(max_length=100)
    description: str
    price: Decimal = Decimal(10, 2)
    quantity: int
    category_id: int

    model_config = ConfigDict(extra="forbid")
    

class ProductDTO(BaseModel):
    id: int
    title: str = Field(max_length=100)
    description: str
    price: Decimal = Decimal(10, 2)
    quantity: int
    enabled: bool = Field(default=True)
    rating_avg: Decimal = Field(default=0), Decimal(3, 1)
    rating_count: int = Field(default=0)
    created_at: datetime
    images: list[ProductImageDTO] = []
    store: StoreDTO
    category: CategoryDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
