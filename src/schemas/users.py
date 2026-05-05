from datetime import datetime

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID


class CreateUserDTO(BaseModel):
    username: str = Field(max_length=25)
    email: EmailStr = Field(max_length=256)
    password: str
    description: str | None = Field(max_length=300), None

    model_config = ConfigDict(extra="forbid")


class UserDTO(BaseModel):
    id: UUID
    public_id: UUID = Field(max_length=8)
    username: str = Field(max_length=25)
    email: EmailStr = Field(max_length=256)
    description: str | None = Field(max_length=300)
    created_at: datetime
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
