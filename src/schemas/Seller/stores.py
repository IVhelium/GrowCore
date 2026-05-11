from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.Store.products import ReadProductDTO
from schemas.User.users import ReadUserDTO

class CreateStoreDTO(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(max_length=300)
    
    model_config = ConfigDict(extra="forbid")
    
    
class ReadStoreDTO(CreateStoreDTO):
    id: UUID
    created_at: datetime
    
    user: ReadUserDTO
    products: list[ReadProductDTO] = []
    
    model_config = ConfigDict(from_attributes=True)