from fastapi import Depends, HTTPException, status
from typing import Annotated
from collections.abc import Callable
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.services.products import ProductModerationService, ProductImageService
from src.api.services.seller_requests import SellerRequestAdminService, SellerRequestService
from src.core.constants import RoleStatus
from src.models.User.user_roles import UserRoleModel
from src.core.database import get_session
from src.core.security import auth
from src.models import UserModel
from src.api.services.auth import AuthService
from src.api.services.user import UserService
from src.api.services.products.product import ProductService
from src.api.services.files.file_storage import FileStorageService


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


# Get Auth Service
async def get_auth_service(db: SessionDependency) -> AuthService:
    return AuthService(db)

AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]


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


# Roles
def require_roles(*allowed_roles: RoleStatus) -> Callable:
    async def role_checker(current_user: CurrentUserDependency) -> UserModel:
        current_roles = {
            relation.role.role
            for relation in current_user.roles
        }
        
        if not current_roles.intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not hove premission to perform this action"
            )
        
        return current_user
    return role_checker
    
SellerDependency = Annotated[UserModel, Depends(require_roles(RoleStatus.seller))]
AdminDependency = Annotated[UserModel, Depends(require_roles(RoleStatus.admin))]
SupportDependency = Annotated[UserModel, Depends(require_roles(RoleStatus.support))]
SupportOrAdminDependency = Annotated[UserModel, Depends(require_roles(RoleStatus.support , RoleStatus.admin))]
    

# Get File Storage Service
async def get_file_storage_service() -> FileStorageService:
    return FileStorageService()

FileStorageServiceDependency = Annotated[FileStorageService, Depends(get_file_storage_service)]


# Get User Service
async def get_user_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
) -> UserService:
    return UserService(
        db=db, 
        file_storage_service=file_storage_service
    )

UserServiceDependency = Annotated[UserService, Depends(get_user_service)]


# Get Product Service
async def get_product_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
) -> ProductService: 
    return ProductService(
        db=db,
        file_storage_service=file_storage_service
    )

ProductServiceDependency = Annotated[ProductService, Depends(get_product_service)]

# Get Product Image Service
async def get_product_image_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
):
    return ProductService(
        db=db,
        file_storage_service=file_storage_service
    )
    
ProductImageServiceDependency = Annotated[ProductImageService, Depends(get_product_image_service)]

# Get Product Moderation Service
async def get_product_moderation_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
):
    return ProductService(
        db=db,
        file_storage_service=file_storage_service
    )
    
ProductModerationServiceDependency = Annotated[ProductModerationService, Depends(get_product_moderation_service)]


# Get Seller Request Service
async def get_seller_request_service(db: SessionDependency) -> SellerRequestService:
    return SellerRequestService(db=db)

SellerRequestServiceDependency = Annotated[SellerRequestService, Depends(get_seller_request_service)]

# Get Seller Request Moderation Service
async def get_seller_request_moderation_service(db: SessionDependency) -> SellerRequestAdminService:
    return SellerRequestAdminService(db=db)

SellerRequestAdminServiceDependency = Annotated[SellerRequestAdminService, Depends(get_seller_request_moderation_service)]