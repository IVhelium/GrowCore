from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.Store.products import ProductDTO

class CreateStoreDTO(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(max_length=300)
    
    model_config = ConfigDict(extra="forbid")
    
    
class StoreDTO(BaseModel):
    id: UUID
    name: str = Field(max_length=100)
    description: str | None = Field(max_length=300)
    created_at: datetime
    
    products: list[ProductDTO] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)