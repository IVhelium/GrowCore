from pydantic import BaseModel, Field, ConfigDict
from models.User.roles import RoleStatus

class RoleDTO(BaseModel):
    id: int
    role: RoleStatus
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)