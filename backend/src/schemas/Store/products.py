from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.core.constants import ProductModerationStatus


def validate_product_description(value: str) -> str:
    clean_value = value.strip()

    if not clean_value:
        raise ValueError("Field cannot be empty")

    required_sections = [
        "overview:",
        "use case:",
        "compatibility:",
        "package includes:",
        "characteristics:",
    ]

    for section in required_sections:
        if section not in clean_value.lower():
            raise ValueError("Product description must keep the default sections")

    marker = "characteristics:"
    marker_index = clean_value.lower().find(marker)

    if marker_index == -1:
        raise ValueError("Product description must include a Characteristics section")

    characteristics_text = clean_value[marker_index + len(marker):]
    filled_lines = []

    for line in characteristics_text.splitlines():
        clean_line = line.strip().lstrip("-*").strip()

        if not clean_line or ":" not in clean_line:
            continue

        _, filled_value = clean_line.split(":", 1)

        if len(filled_value.strip()) >= 2:
            filled_lines.append(clean_line)

    has_brand = any(line.lower().startswith("brand:") for line in filled_lines)
    has_warranty = any(line.lower().startswith("warranty:") for line in filled_lines)

    if not has_brand or not has_warranty:
        raise ValueError("Product characteristics must include Brand and Warranty")

    return clean_value


# Product Image Read Schema
class ReadProductImageDTO(BaseModel):
    id: int
    image: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
class ReadProductCategoryDTO(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
class ReadProductStoreDTO(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
  
    
# Product Create Schemas
class CreateProductDTO(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)
    price: Decimal = Field(ge=0)
    discount_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount_expires_at: datetime | None = None
    quantity: int = Field(ge=0)
    category_id: int
    attributes: dict[str, str] = Field(default_factory=dict)

    @field_validator("title", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty")
        return value

    @field_validator("description", mode="before")
    @classmethod
    def validate_required_description(cls, value):
        if isinstance(value, str):
            return validate_product_description(value)
        return value

    model_config = ConfigDict(extra="forbid")
    

# Product Update Schema
class UpdateProductDTO(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=200)
    description: str | None = Field(default=None, min_length=20)
    price: Decimal | None = Field(default=None, ge=0)
    discount_percent: Decimal | None = Field(default=None, ge=0, le=100)
    discount_expires_at: datetime | None = None
    quantity: int | None = Field(default=None, ge=0)
    enabled: bool | None = None
    category_id: int | None = None
    attributes: dict[str, str] | None = None

    @field_validator("title", mode="before")
    @classmethod
    def trim_optional_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty")
        return value

    @field_validator("description", mode="before")
    @classmethod
    def validate_optional_description(cls, value):
        if isinstance(value, str):
            return validate_product_description(value)
        return value

    model_config = ConfigDict(extra="forbid")
    
    
class UpdateProductAvailabilityDTO(BaseModel):
    enabled: bool
    
    model_config = ConfigDict(extra="forbid")
 
 
class RejectProductDTO(BaseModel):
    reason: str = Field(min_length=10, max_length=400)

    @field_validator("reason", mode="before")
    @classmethod
    def trim_reason(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value
    
    model_config = ConfigDict(extra="forbid") 


class DeleteProductDTO(BaseModel):
    reason: str = Field(min_length=10, max_length=400)

    @field_validator("reason", mode="before")
    @classmethod
    def trim_reason(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    model_config = ConfigDict(extra="forbid")
    
    
# Product Short Schema
class ShortProductDTO(BaseModel):
    id: int
    title: str
    price: Decimal
    discount_percent: Decimal = Decimal("0.00")
    discount_expires_at: datetime | None = None
    discounted_price: Decimal
    has_discount: bool = False
    rating_avg: Decimal
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    

# Product Read Schema
class ReadProductDTO(BaseModel):
    id: int
    title: str = Field(max_length=100)
    description: str
    
    price: Decimal
    discount_percent: Decimal = Decimal("0.00")
    discount_expires_at: datetime | None = None
    discounted_price: Decimal
    has_discount: bool = False
    quantity: int
    attributes: dict[str, str] = Field(default_factory=dict)
    
    enabled: bool
    moderation_status: ProductModerationStatus
    rejection_reason: str | None = None
    deletion_reason: str | None = None
    
    rating_avg: Decimal
    rating_count: int
    
    created_at: datetime
    moderated_at: datetime | None = None
    deleted_at: datetime | None = None
    
    store: "ReadProductStoreDTO"
    category: "ReadProductCategoryDTO"
    images: list["ReadProductImageDTO"]
    reviews: list["ReadReviewDTO"]
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)   
