from pydantic import BaseModel, ConfigDict, Field

from schemas.User.roles import RoleDTO

class UserRoleDTO(BaseModel):
    role: RoleDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)