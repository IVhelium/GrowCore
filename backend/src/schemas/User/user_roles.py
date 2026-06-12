from pydantic import BaseModel, ConfigDict, Field


class ReadUserRoleDTO(BaseModel):
    role: "ReadRoleDTO"
    
    model_config = ConfigDict(extra="forbid", from_attributes=True)