from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

 
    
# Cart Item Create Schema
class AddCartItemDTO(BaseModel):
    quantity: int = Field(default=1, ge=1)
    product_id: int
    
    model_config = ConfigDict(extra="forbid")


# Cart Item Update Schema
class UpdateCartItemDTO(BaseModel):
    quantity: int = Field(ge=1)
    
    model_config = ConfigDict(extra="forbid")
    

class ReadCartProductImageDTO(BaseModel):
    id: int
    image: str

    model_config = ConfigDict(from_attributes=True)
    

class ReadCartProductDTO(BaseModel):
    id: int
    title: str
    price: Decimal
    discount_percent: Decimal = Decimal("0.00")
    discount_expires_at: datetime | None = None
    discounted_price: Decimal
    has_discount: bool = False
    quantity: int
    enabled: bool
    
    images: list[ReadCartProductImageDTO] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
# Cart Item Read Schema
class ReadCartItemDTO(BaseModel):
    id: int
    quantity: int
    
    product: ReadCartProductDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)


# Cart Read Schemas
class ReadCartDTO(BaseModel):
    id: UUID
    items: list["ReadCartItemDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
