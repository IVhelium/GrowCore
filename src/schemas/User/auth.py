from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Register Schema
class RegisterDTO(BaseModel):
    username: str = Field(min_length=1, max_length=25)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    
    model_config = ConfigDict(extra="forbid")
    
    
# Login Schema
class LoginDTO(BaseModel):
    email: EmailStr
    password: str
    
    model_config = ConfigDict(extra="forbid")
    
    
# Token Response Schema
class TokenResponseDTO(BaseModel):
    massage: str