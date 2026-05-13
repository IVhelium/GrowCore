from pydantic import BaseModel, ConfigDict, Field


# Category Create Schema
class CreateCategoryDTO(BaseModel):
    name: str
    
    model_config = ConfigDict(extra="forbid")


# Category Read Schema
class ReadCategoryDTO(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)