from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import ConfigDict, BaseModel, Field

from backend.src.core.constants import OrderStatus
    
    
# Order Item Read Schema
class ReadOrderItemDTO(BaseModel):
    id: int
    price: Decimal
    quantity: int
    product_id: "ReadProductDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    
# Order Read Schemas
class ReadOrderDTO(BaseModel):
    id: int
    status: OrderStatus
    total_price: Decimal
    created_id: datetime
    user_id: UUID
    items: list["ReadOrderItemDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)