from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReadNotificationDTO(BaseModel):
    id: int
    title: str
    message: str
    link_url: str | None = None
    occurrence_count: int = 1
    read_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(extra="forbid", from_attributes=True)
