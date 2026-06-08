from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.core.constants import SupportTicketStatus
from src.schemas import ShortUserDTO


class CreateSupportTicketDTO(BaseModel):
    subject: str = Field(min_length=1, max_length=150)
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("subject", "message", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty")
        return value

    model_config = ConfigDict(extra="forbid")


class UpdateSupportTicketDTO(BaseModel):
    response: str | None = Field(default=None, max_length=2000)
    status: SupportTicketStatus | None = None

    @field_validator("response", mode="before")
    @classmethod
    def trim_response(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Response cannot be empty")
        return value

    model_config = ConfigDict(extra="forbid")


class ReadSupportTicketDTO(BaseModel):
    id: int

    subject: str
    message: str
    response: str | None = None

    status: SupportTicketStatus

    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None

    user: ShortUserDTO
    assigned_support: ShortUserDTO | None = None

    model_config = ConfigDict(from_attributes=True)
