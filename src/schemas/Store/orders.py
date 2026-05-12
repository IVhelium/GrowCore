from datetime import datetime
from uuid import UUID

from pydantic import ConfigDict, BaseModel, Field

from models.Store.orders import OrderStatus
from schemas.Store.products import ReadProductDTO
    
    
# Order Item Schemas
class ReadOrderItemDTO(BaseModel):
    id: int
    price: float
    quantity: int
    created_at: datetime
    user_id: UUID
    product_id: ReadProductDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    
# Order Schemas
class ReadOrderDTO(BaseModel):
    id: int
    status: OrderStatus
    total_price: float
    created_id: datetime
    user_id: UUID
    items: list[ReadOrderItemDTO] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)