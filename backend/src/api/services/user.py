import re
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.src.api.services.avatar import AvatarService
from backend.src.core.constants import AVATAR_URL_PREFIX, PUBLIC_ID_RE
from backend.src.models import UserModel, UserRoleModel
from backend.src.schemas import UpdateUserDTO


class UserService:
    def __init__(
        self,
        db: AsyncSession,
        avatar_service: AvatarService
    ):
        self.db = db
        self.avatar_service = avatar_service
        
    
    @staticmethod
    def normalize_public_id(public_id: str) -> str:  # Нормализация публичного адйи к правильному типу
        value = public_id.strip().upper()
        
        if not value.startswith("#"):   # Если айди не начинается с хетега то добавляет его с начал строки к айди
            value = f"#{value}"
            
        if not PUBLIC_ID_RE.fullmatch(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid public_id format. Example: #A1B2C3D4E5"
            )
            
        return value
    
    
    # Получаем юзера с ролями
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
    
    
    # Получение пользователя с публичным айди
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
    
    
    # Метод для обновление данного пользователя
    async def update_current_user(
        self,
        current_user: UserModel,
        schema: UpdateUserDTO
    ) -> UserModel:
        
        data = schema.model_dump(exclude_unset=True)    # Преобразует схему в словарь
        
        if not data:
            return await self.get_user_with_relations(current_user.id)
        
        username = data.get("username")    # Достает юсернейм из схемы
        
        if username is not None:   
            # Если юсернейм был изменен, проверка на уже имеющиеся в базе
            if username != current_user.username:
                query = (
                    select(UserModel)
                    .where(
                        UserModel.username == username,
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
                    
            data["username"] = username
            
        # Обновляем объект
        for field, value in data.items():
            setattr(current_user, field, value)
           
            
        try:
            await self.db.commit()

        except IntegrityError:
            await self.db.rollback()
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User update conflict"
            )
            
        return await self.get_user_with_relations(current_user.id)
        
    
    # Метод загрузки аватара
    async def upload_avatar(
        self,
        current_user: UserModel,
        avatar: UploadFile
    ) -> UserModel:
        """Загружает новый аватар пользователю, если уже существует, то добавляет новый и удаляет старый"""
        
        old_avatar_url = current_user.avatar_url
        
        new_filename = await self.avatar_service.save_avatar(avatar)
        new_avatar_url = f"{AVATAR_URL_PREFIX}/{new_filename}"
        
        current_user.avatar_url = new_avatar_url
        
        try:
            await self.db.commit()
            
        except Exception:
            await self.db.rollback()
            
            self.avatar_service.delete_avatar(new_avatar_url)
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save avatar"
            )
            
        self.avatar_service.delete_avatar(old_avatar_url)
        
        return await self.get_user_with_relations(current_user.id)
    
    
    # Метод удаления аватара
    async def delete_avatar(
        self,
        current_user: UserModel
    ) -> UserModel:
        """Удаляет аватар текущего пользователя. Сначала аватар удаляется с Бд. После успешного коммита удаляется с диска"""
        
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
            
        self.avatar_service.delete_avatar(old_avatar_url)
        
        return await self.get_user_with_relations(current_user.id)