from datetime import datetime

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID


# User Create Schema
class CreateUserDTO(BaseModel):
    username: str = Field(max_length=32)
    email: EmailStr
    password: str

    model_config = ConfigDict(extra="forbid")
    

# User Short Schema
class ShortUserDTO(BaseModel):
    public_id: str
    username: str = Field(max_length=32)
    avatar_url: str | None
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)


# User Login Schema
class LoginUserDTO(BaseModel):
    email: EmailStr
    password: str
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    
    
# User Update Schema
class UpdateUserDTO(BaseModel):
    username: str | None = Field(max_length=32)
    avatar_url: str | None
    description: str | None    
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    

# User Read Schema
class ReadUserDTO(BaseModel):
    id: UUID
    public_id: str
    username: str = Field(max_length=32)
    email: EmailStr
    avatar_url: str | None
    description: str | None
    followers_count: int = Field(default=0)
    following_count: int = Field(default=0)
    created_at: datetime
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)
