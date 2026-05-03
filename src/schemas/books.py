# Pydantic
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Add a new book
class NewBookSchema(BaseModel):   # Define the data model for a new book, for validation purposes
    title: str | None = Field(max_length=100)   # Title is a required field with a length constraint
    author: str | None
    
    model_config = ConfigDict(extra="forbid")   # Forbid extra fields not defined in the model
    
class BookSchema(NewBookSchema):
    id: int