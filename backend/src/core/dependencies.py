from fastapi import Depends, HTTPException, status
from typing import Annotated
from collections.abc import Callable
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.services.products.product_image import ProductImageService
from src.api.services.products.product_moderation import ProductModerationService
from src.api.services.seller_requests.seller_request import SellerRequestService
from src.api.services.seller_requests.seller_request_admin import SellerRequestAdminService
from src.core.constants import RoleStatus
from src.models.User.user_roles import UserRoleModel
from src.core.database import get_session
from src.core.security import auth
from src.models import UserModel
from src.api.services.auth import AuthService
from src.api.services.user import UserService
from src.api.services.products.product import ProductService
from src.api.services.files.file_storage import FileStorageService
from src.api.services.store import StoreService
from src.api.services.support_ticket import SupportTicketService
from src.api.services.cart import CartService
from src.api.services.chat import ChatService
from src.api.services.favorite import FavoriteService
from src.api.services.category import CategoryService
from src.api.services.order import OrderService
from src.api.services.notification import NotificationService


SessionDependency = Annotated[AsyncSession, Depends(get_session)]


# Get Auth Service
async def get_auth_service(db: SessionDependency) -> AuthService:
    """Creates the authentication service for the current request."""
    return AuthService(db)

AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]


# Get Current User
async def get_current_user(
    db: SessionDependency, 
    payload=Depends(auth.access_token_required)
):
    """Reads the access token and loads the signed-in user with their roles."""
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
    """Creates a dependency that allows access only to the supplied user roles."""
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
    """Creates the service that stores and removes uploaded files."""
    return FileStorageService()

FileStorageServiceDependency = Annotated[FileStorageService, Depends(get_file_storage_service)]


# Get User Service
async def get_user_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
) -> UserService:
    """Creates the service responsible for profiles, friends, and notifications."""
    return UserService(
        db=db, 
        file_storage_service=file_storage_service
    )

UserServiceDependency = Annotated[UserService, Depends(get_user_service)]


async def get_chat_service(
    db: SessionDependency,
) -> ChatService:
    """Creates the service used to load and send chat messages."""
    return ChatService(db=db)

ChatServiceDependency = Annotated[ChatService, Depends(get_chat_service)]


# Get Product Service
async def get_product_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
) -> ProductService: 
    """Creates the service for seller products and the public catalogue."""
    return ProductService(
        db=db,
        file_storage_service=file_storage_service
    )

ProductServiceDependency = Annotated[ProductService, Depends(get_product_service)]


# Get Category Service
async def get_category_service(db: SessionDependency) -> CategoryService:
    """Creates the service used to read and manage product categories."""
    return CategoryService(db=db)

CategoryServiceDependency = Annotated[CategoryService, Depends(get_category_service)]

# Get Product Image Service
async def get_product_image_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency
):
    """Creates the service that validates and saves product images."""
    return ProductImageService(
        db=db,
        file_storage_service=file_storage_service
    )
    
ProductImageServiceDependency = Annotated[ProductImageService, Depends(get_product_image_service)]

# Get Product Moderation Service
async def get_product_moderation_service(
    db: SessionDependency,
):
    """Creates the administrator service for product moderation decisions."""
    return ProductModerationService(
        db=db,
    )
    
ProductModerationServiceDependency = Annotated[ProductModerationService, Depends(get_product_moderation_service)]


# Get Seller Request Service
async def get_seller_request_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency,
) -> SellerRequestService:
    """Creates the service for a user's seller application."""
    return SellerRequestService(
        db=db,
        file_storage_service=file_storage_service,
    )

SellerRequestServiceDependency = Annotated[SellerRequestService, Depends(get_seller_request_service)]

# Get Seller Request Moderation Service
async def get_seller_request_moderation_service(
    db: SessionDependency,
    file_storage_service: FileStorageServiceDependency,
) -> SellerRequestAdminService:
    """Creates the service used by admins to review seller applications."""
    return SellerRequestAdminService(
        db=db,
        file_storage_service=file_storage_service,
    )

SellerRequestAdminServiceDependency = Annotated[SellerRequestAdminService, Depends(get_seller_request_moderation_service)]


# Get Store Service
async def get_store_service(db: SessionDependency) -> StoreService:
    """Creates the service that reads and updates seller stores."""
    return StoreService(db=db)

StoreServiceDependency = Annotated[StoreService, Depends(get_store_service)]


# Get Support Ticket Service
async def get_support_ticket_service(db: SessionDependency) -> SupportTicketService:
    """Creates the service that manages customer support tickets."""
    return SupportTicketService(db=db)

SupportTicketServiceDependency = Annotated[SupportTicketService, Depends(get_support_ticket_service)]


# Get Cart Service
async def get_cart_service(
    db: SessionDependency,
) -> CartService:
    """Creates the service used for shopping-cart operations."""
    return CartService(db=db)

CartServiceDependency = Annotated[CartService, Depends(get_cart_service)]


# Get Favorite Service
async def get_favorite_service(
    db: SessionDependency,
) -> FavoriteService:
    """Creates the favourites service together with its cart helper."""
    cart_service = CartService(db=db)

    return FavoriteService(
        db=db,
        cart_service=cart_service,
    )

FavoriteServiceDependency = Annotated[FavoriteService, Depends(get_favorite_service)]


# Get Order Service
async def get_order_service(
    db: SessionDependency,
) -> OrderService:
    """Creates the service for orders, payments, delivery, and returns."""
    return OrderService(db=db)

OrderServiceDependency = Annotated[OrderService, Depends(get_order_service)]


async def get_notification_service(
    db: SessionDependency,
) -> NotificationService:
    """Creates the service that creates and reads user notifications."""
    return NotificationService(db=db)

NotificationServiceDependency = Annotated[NotificationService, Depends(get_notification_service)]
