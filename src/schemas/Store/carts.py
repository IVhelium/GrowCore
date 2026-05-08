from pydantic import BaseModel, ConfigDict, Field

from schemas.Store.products import ProductDTO

class CartDTO(BaseModel):
    id: int
    items: list[ProductDTO] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)