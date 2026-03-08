from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session


SessionDependency = Annotated[AsyncSession, Depends(get_session)]