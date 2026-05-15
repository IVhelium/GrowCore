from fastapi import Depends, HTTPException, status
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_session
from src.core.security import auth
from src.models import UserModel
from src.api.services.auth import AuthService


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


# Get Current User
async def get_current_user(
    db: SessionDependency, 
    uid=Depends(auth.access_token_required)
):
    query = (
        select(UserModel)
        .options(
            selectinload(UserModel.roles)
            .selectinload("roles")
        )
        .where(UserModel.id == uid)
    )
    
    result = await db.execute(query)    
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
    
    return user


# Get Auth Service
async def get_auth_service(db: SessionDependency) -> AuthService:
    return AuthService(db)