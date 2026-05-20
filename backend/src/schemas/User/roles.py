from pydantic import BaseModel, Field, ConfigDict
from backend.src.core.constants import RoleStatus

class ReadRoleDTO(BaseModel):
    id: int
    role: RoleStatus
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)