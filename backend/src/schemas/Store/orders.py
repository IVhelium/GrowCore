from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import ConfigDict, BaseModel, Field, field_validator

from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ReturnStatus


class CheckoutDTO(BaseModel):
    delivery_address: str = Field(min_length=5, max_length=300)

    @field_validator("delivery_address", mode="before")
    @classmethod
    def trim_delivery_address(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Delivery address cannot be empty")
        return value

    model_config = ConfigDict(extra="forbid")


class RequestReturnDTO(BaseModel):
    reason: str = Field(min_length=10, max_length=400)

    @field_validator("reason", mode="before")
    @classmethod
    def trim_reason(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Return reason cannot be empty")
        return value

    model_config = ConfigDict(extra="forbid")


class UpdateDeliveryDTO(BaseModel):
    delivery_status: DeliveryStatus
    tracking_number: str | None = Field(default=None, max_length=80)

    @field_validator("tracking_number", mode="before")
    @classmethod
    def trim_tracking_number(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        return value

    model_config = ConfigDict(extra="forbid")


class ReadOrderProductImageDTO(BaseModel):
    id: int
    image: str

    model_config = ConfigDict(extra="forbid", from_attributes=True)


class ReadOrderProductDTO(BaseModel):
    id: int
    title: str
    price: Decimal
    images: list[ReadOrderProductImageDTO] = []

    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
# Order Item Read Schema
class ReadOrderItemDTO(BaseModel):
    id: int
    price: Decimal
    quantity: int
    product: ReadOrderProductDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    
# Order Read Schemas
class ReadOrderDTO(BaseModel):
    id: int
    status: OrderStatus
    payment_status: PaymentStatus
    delivery_status: DeliveryStatus
    return_status: ReturnStatus
    total_price: Decimal
    payment_transaction_id: str | None = None
    payment_document: str | None = None
    delivery_address: str | None = None
    tracking_number: str | None = None
    return_reason: str | None = None
    created_at: datetime
    user_id: UUID
    items: list["ReadOrderItemDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
