from fastapi import Depends, HTTPException, UploadFile, status
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.User.user_roles import UserRoleModel
from src.core.database import get_session
from src.core.security import auth
from src.models import UserModel
from src.api.services.auth import AuthService
from src.api.services.avatar import AvatarService
from src.core.constants import ALLOWED_AVATAR_CONTENT_TYPES


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


# region Get Services

# Get Auth Service
async def get_auth_service(db: SessionDependency) -> AuthService:
    return AuthService(db)

# Get Avatar Service
async def get_avatar_service() -> AvatarService:
    return AvatarService()


# endregion



# Get Current User
async def get_current_user(
    db: SessionDependency, 
    payload=Depends(auth.access_token_required)
):
    query = (
        select(UserModel)
        .options(
            selectinload(UserModel.roles)
            .selectinload(UserRoleModel.role)
        )
        .where(UserModel.id == payload.sub)
    )
    
    result = await db.execute(query)    
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
    
    return user


# Avatar Validation
SIGNATURES = {    # Словарь валидации типов
    "image/jpeg": lambda h: h.startswith(b"\xff\xd8\xff"),
    "image/png":  lambda h: h.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda h: h.startswith(b"RIFF") and h[8:12] == b"WEBP"
}

async def validate_avatar_upload(file: UploadFile) -> UploadFile:
    """Зависимость для первичной валидации структуры заголовков и сигнатуры"""
    
    normalized_content_type = AvatarService.n
    
    if file.content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type. Allowed: {list(ALLOWED_AVATAR_CONTENT_TYPES.keys())}"
        )
        
    header = await file.read(12)   # Чтение первых 12 байт, чтоб проверить реальный тип файла
    await file.seek(0)             # Сброс указателя для последующего чтения в сервисе
    
    if not SIGNATURES[file.content_type](header):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Invalid image file signature"
        )
        
    return file