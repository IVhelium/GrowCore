from pydantic import BaseModel, ConfigDict, Field


# Category Create Schema
class CreateCategoryDTO(BaseModel):
    name: str
    icon_name: str = "SlidersHorizontal"
    sort_order: int = 0
    
    model_config = ConfigDict(extra="forbid")


# Category Read Schema
class ReadCategoryDTO(BaseModel):
    id: int
    name: str
    image_url: str
    icon_name: str
    sort_order: int
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)

class UpdateCategoryDTO(BaseModel):
    name: str | None = None
    icon_name: str | None = None
    sort_order: int | None = None

    model_config = ConfigDict(extra="forbid")
