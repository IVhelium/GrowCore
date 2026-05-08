from pydantic import BaseModel, ConfigDict, Field

class CategoryDTO(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)