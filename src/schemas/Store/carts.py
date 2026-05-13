from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

 
    
# Cart Item Schemas
class BaseCartItemDTO(BaseModel):
    quantity: int = Field(ge=0)
    product_id: int

    
class CreateCartItemDTO(BaseCartItemDTO):
    model_config = ConfigDict(extra="forbid")


class ReadCartItemDTO(BaseModel):
    id: int
    quantity: int
    product_id: "ReadProductDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    

# Cart Schemas
class ReadCartDTO(BaseModel):
    id: int
    user_id: UUID
    items: list["ReadCartItemDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)