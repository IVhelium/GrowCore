from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Store Create Schema
class CreateStoreDTO(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(max_length=300)
    
    model_config = ConfigDict(extra="forbid")
    

# Store Update Schema
class UpdateStoreDTO(BaseModel):
    name: str | None = Field(min_length=3, max_length=100)
    description: str | None = Field(max_length=300)
    
    model_config = ConfigDict(extra="forbid")
    
    
# Store Short Schema
class ShortStoreDTO(BaseModel):
    id: UUID
    name: str = Field(max_length=100)
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)


# Store Read Schema 
class ReadStoreDTO(CreateStoreDTO):
    id: UUID
    name: str
    description: str | None = None
    created_at: datetime
    
    user: "ReadUserDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)