from pydantic import BaseModel, ConfigDict, Field

from schemas.User.roles import ReadRoleDTO

class ReadUserRoleDTO(BaseModel):
    role: ReadRoleDTO
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)