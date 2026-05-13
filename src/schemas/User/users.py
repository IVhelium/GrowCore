from datetime import datetime

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID


# Базовый класс юзера для наследия
class BaseUserDTO(BaseModel):
    username: str = Field(max_length=25)
    email: EmailStr = Field(max_length=256)
    avatar_url: str | None = None
    description: str | None = Field(max_length=300), None


# Класс для создания юзера
class CreateUserDTO(BaseUserDTO):
    password: str

    model_config = ConfigDict(extra="forbid")


# Класс для чтения юзера
class ReadUserDTO(BaseUserDTO):
    id: UUID
    public_id: UUID = Field(max_length=8)
    followers_count: int = Field(default=0)
    following_count: int = Field(default=0)
    created_at: datetime
    
    roles: list["ReadUserRoleDTO"] = []
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
