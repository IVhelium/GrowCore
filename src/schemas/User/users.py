from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID


class CreateUserDTO(BaseModel):
    username: str = Field(max_length=25)
    email: EmailStr
    password: str

    model_config = ConfigDict(extra="forbid", from_attributes=True)


class UserDTO(CreateUserDTO):
    id: UUID
