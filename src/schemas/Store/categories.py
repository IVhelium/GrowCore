from pydantic import BaseModel, ConfigDict, Field


class CreateCategoryDTO(BaseModel):
    name: str
    
    model_config = ConfigDict(extra="forbid")


class ReadCategoryDTO(CreateCategoryDTO):
    id: int
    
    model_config = ConfigDict(from_attributes=True)