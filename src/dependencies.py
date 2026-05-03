from fastapi import Depends
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_session


SessionDependency = Annotated[AsyncSession, Depends(get_session)]