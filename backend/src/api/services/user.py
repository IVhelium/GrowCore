import re
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.utils.storage_paths import avatar_directory_key
from src.api.services.files.file_storage import FileStorageService
from src.core.upload_policies import AVATAR_POLICY
from src.core.constants import PUBLIC_ID_RE
from src.models import UserModel, UserRoleModel
from src.schemas import UpdateUserDTO


class UserService:
    def __init__(
        self,
        db: AsyncSession,
        file_storage_service: FileStorageService
    ):
        self.db = db
        self.file_storage_service = file_storage_service
        
    
    @staticmethod
    def normalize_public_id(public_id: str) -> str:  # Normalizing public data to the correct type
        value = public_id.strip().upper()
        
        if not value.startswith("#"):                # If the ID doesn't start with a hashtag, it adds one at the beginning of the ID
            value = f"#{value}"
            
        if not PUBLIC_ID_RE.fullmatch(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid public_id format. Example: #A1B2C3D4E5"
            )
            
        return value
    
    
    # Retrieving a user with roles
    async def get_user_with_relations(
        self,
        user_id: str
    ) -> UserModel:
        
        query = (
            select(UserModel)
            .options(
                selectinload(UserModel.roles)
                .selectinload(UserRoleModel.role)
            )
            .where(UserModel.id == user_id)
        )
        
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return user
    
    
    # Retrieving a user by public ID
    async def get_user_by_public_id(
        self,
        public_id: str  
    ) -> UserModel:
        
        normalize_public_id = self.normalize_public_id(public_id)
        
        query = (
            select(UserModel)
            .where(UserModel.public_id == normalize_public_id)
        )
        
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    
    # Method for updating current user
    async def update_current_user(
        self,
        current_user: UserModel,
        schema: UpdateUserDTO
    ) -> UserModel:
        
        data = schema.model_dump(exclude_unset=True)    # Converts the schema into a dictionary
        
        if not data:
            return await self.get_user_with_relations(current_user.id)
        
        username = data.get("username")                 # Retrieves the username from the schema
        
        if username is not None:
            normalized_username = username.strip()
            
            if not normalized_username:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Username cannot be empty"
                )  
               
            # If the username has been changed, check the database for existing entries
            if normalized_username != current_user.username:
                query = (
                    select(UserModel)
                    .where(
                        UserModel.username == normalized_username,
                        UserModel.id != current_user.id
                    )
                )
                
                result = await self.db.execute(query)
                user_exists = result.scalar_one_or_none()
                
                if user_exists:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Username already exists"
                    )
                    
            data["username"] = normalized_username
            
        # Updating the object
        for field, value in data.items():
            setattr(current_user, field, value)
           
        self.db.add(current_user)
            
        try:
            await self.db.commit()

        except IntegrityError:
            await self.db.rollback()
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User update conflict"
            )
            
        return await self.get_user_with_relations(current_user.id)
        
    
    # Method for upload an avatar
    async def upload_avatar(
        self,
        current_user: UserModel,
        avatar: UploadFile
    ) -> UserModel:
        """Uploads a new avatar for the user; if one already exists, it adds the new one and deletes the old one"""
        
        old_avatar_url = current_user.avatar_url
        
        stored_file = await self.file_storage_service.save_file(
            file=avatar,
            policy=AVATAR_POLICY,
            directory_key=avatar_directory_key(current_user)
        )
        
        if stored_file.public_url is None:
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=AVATAR_POLICY
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Avatar public URL is not configured"
            )
        
        current_user.avatar_url = stored_file.public_url
        
        try:
            await self.db.commit()
            
        except Exception:
            await self.db.rollback()
            
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=AVATAR_POLICY
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar was saved, but profile update failed"
            )
            
        self.file_storage_service.delete_by_public_url(
            public_url=old_avatar_url,
            policy=AVATAR_POLICY
        )
        
        return await self.get_user_with_relations(current_user.id)
    
    
    # Method for removing an avatar
    async def delete_avatar(
        self,
        current_user: UserModel
    ) -> UserModel:
        """Deletes the current user's avatar. First, the avatar is deleted from the database. After a successful commit, it is deleted from disk."""
        
        old_avatar_url = current_user.avatar_url
        
        if old_avatar_url is None:
            return await self.get_user_with_relations(current_user.id)
        
        current_user.avatar_url = None
        
        try:
            await self.db.commit()
            
        except Exception:
            await self.db.rollback()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar delete failed"
            )
            
        self.file_storage_service.delete_by_public_url(
            public_url=old_avatar_url,
            policy=AVATAR_POLICY
        )
        
        return await self.get_user_with_relations(current_user.id)