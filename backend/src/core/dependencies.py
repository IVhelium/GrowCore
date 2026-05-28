from fastapi import Depends, File, HTTPException, UploadFile, status
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.User.user_roles import UserRoleModel
from src.core.database import get_session
from src.core.security import auth
from src.models import UserModel
from src.api.services.auth import AuthService
from src.api.services.user import UserService
from src.api.services.avatar import AvatarService
from src.core.constants import ALLOWED_AVATAR_CONTENT_TYPES


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


# Get Auth Service
async def get_auth_service(db: SessionDependency) -> AuthService:
    return AuthService(db)

AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]

# Get Avatar Service
async def get_avatar_service() -> AvatarService:
    return AvatarService()

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

CurrentUserDependency = Annotated[UserModel, Depends(get_current_user)]


# Avatar Validation
SIGNATURES = {    # Type Validation Dictionary
    "image/jpeg": lambda h: h.startswith(b"\xff\xd8\xff"),
    "image/png":  lambda h: h.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda h: h.startswith(b"RIFF") and h[8:12] == b"WEBP"
}

async def validate_avatar_upload(file: UploadFile = File(...)) -> UploadFile:
    """Dependency for initial validation of header structure and signature"""
    
    normalized_content_type = AvatarService.normalize_content_type(file.content_type)
    
    if normalized_content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_storage_TYPE,
            detail=f"Unsupported storage type. Allowed: {list(ALLOWED_AVATAR_CONTENT_TYPES.keys())}"
        )
        
    header = await file.read(12)   # Read the first 12 bytes to check the actual file type
    await file.seek(0)             # Reset the pointer for subsequent reading in the service
    
    if not SIGNATURES[normalized_content_type](header):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_storage_TYPE,
            detail="Invalid image file signature"
        )
        
    return file

AvatarFileDependency = Annotated[UploadFile, Depends(validate_avatar_upload)]
AvatarServiceDependency = Annotated[AvatarService, Depends(get_avatar_service)]

# Get User Service
async def get_user_service(
    db: SessionDependency,
    avatar_service: AvatarServiceDependency
) -> UserService:
    return UserService(db=db, avatar_service=avatar_service)

UserServiceDependency = Annotated[UserService, Depends(get_user_service)]