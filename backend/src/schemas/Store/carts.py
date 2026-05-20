from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

 
    
# Cart Item Create Schema
class CreateCartItemDTO(BaseModel):
    quantity: int = Field(ge=0)
    product_id: int
    
    model_config = ConfigDict(extra="forbid")


# Cart Item Update Schema
class UpdateCartItemDTO(BaseModel):
    quantity: int
    
    model_config = ConfigDict(extra="forbid")
    

# Cart Item Read Schema
class ReadCartItemDTO(BaseModel):
    id: int
    quantity: int
    product_id: "ReadProductDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    

# Cart Read Schemas
class ReadCartDTO(BaseModel):
    id: int
    items: list["ReadCartItemDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)