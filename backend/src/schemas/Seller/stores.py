from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# Store Create Schema
class CreateStoreDTO(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=300)
    
    model_config = ConfigDict(extra="forbid")
    

# Store Update Schema
class UpdateStoreDTO(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    description: str | None = Field(default=None, max_length=300)

    @field_validator("name", "description", mode="before")
    @classmethod
    def trim_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        return value
    
    model_config = ConfigDict(extra="forbid")
    
    
# Store Short Schema
class ShortStoreDTO(BaseModel):
    id: UUID
    name: str = Field(max_length=100)
    show_in_filters: bool = False
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)

class UpdateStoreFilterDTO(BaseModel):
    show_in_filters: bool

    model_config = ConfigDict(extra="forbid")


# Store Read Schema 
class ReadStoreDTO(CreateStoreDTO):
    id: UUID
    name: str
    description: str | None = None
    created_at: datetime
    
    user: "ReadUserDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
