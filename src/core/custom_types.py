from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from sqlalchemy.orm import mapped_column
from sqlalchemy import text

# Primary Keys
intPk = Annotated[int, mapped_column(primary_key=True, autoincrement=True)]                                                 # Int Primary key type
uuidPk = Annotated[UUID, mapped_column(primary_key=True, default=uuid4)]                                                    # UUID Primary key type


# Datetime
createdAt = Annotated[datetime, mapped_column(server_default=text("TIMEZONE('utc', now())"))]                                                 # Created at datetime type
updatedAt = Annotated[datetime, mapped_column(server_default=text("TIMEZONE('utc', now())"), onupdate=lambda: datetime.now(timezone.utc))]    # Updated at datetime type