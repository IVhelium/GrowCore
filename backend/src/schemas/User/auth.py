from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# Register Schema
class RegisterDTO(BaseModel):
    username: str = Field(min_length=1, max_length=25)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)

    @field_validator("username", "email", "password", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty")
        return value
    
    model_config = ConfigDict(extra="forbid")
    
    
# Login Schema
class LoginDTO(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", "password", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty")
        return value
    
    model_config = ConfigDict(extra="forbid")
    
    
# Token Response Schema
class TokenResponseDTO(BaseModel):
    message: str
    
    model_config = ConfigDict(extra="forbid")
