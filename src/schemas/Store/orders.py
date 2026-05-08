from datetime import datetime
from uuid import UUID

from pydantic import ConfigDict, BaseModel, Field

from models.Store.orders import OrderStatus

class OrderDTO(BaseModel):
    id: int
    status: OrderStatus
    total_price: float
    created_id: datetime
    user_id: UUID
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
class OrderItemDTO(BaseModel):
    id: int
    price: float
    quantity: int
    created_at: datetime
    user_id: UUID
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)