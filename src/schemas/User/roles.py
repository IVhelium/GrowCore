from pydantic import BaseModel, Field, ConfigDict
from src.models.User.roles import RoleStatus

class ReadRoleDTO(BaseModel):
    id: int
    role: RoleStatus
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)