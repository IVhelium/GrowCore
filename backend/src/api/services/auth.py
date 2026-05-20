from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models import UserModel, RoleModel, UserRoleModel
from backend.src.schemas import RegisterDTO, LoginDTO
from backend.src.core.security import hash_password, verify_password
from backend.src.core.constants import RoleStatus


class AuthService:
    def __init__(
        self,
        db: AsyncSession
    ):
        self.db = db
       
        
    # Redister new User method  
    async def register_new_user(
        self,
        schema: RegisterDTO  
    ) -> UserModel:
        """Регистрация нового пользователя с проверкой дубликатов выдачей роли"""
        
        # Check email | username
        exist_query = (
            select(UserModel)
            .where((UserModel.email == schema.email) | (UserModel.username == schema.username))
        )
        
        exist_result = await self.db.execute(exist_query)
        user_exist = exist_result.scalar_one_or_none()
        
        if user_exist:
            field = "Email" if user_exist.email == schema.email else "Username"
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{field} alredy exist"
            )
        
        
        # Get User Role
        role_query = (
            select(RoleModel)
            .where(RoleModel.role == RoleStatus.user)
        )
        
        role_result = await self.db.execute(role_query)
        user_role = role_result.scalar_one_or_none()
        
        
        # Create User
        user = UserModel(
            username=schema.username,
            email=schema.email,
            password_hash=hash_password(schema.password)
        )
        
        self.db.add(user)   
        await self.db.flush()
        
        
        # User Role Relation
        user_role_relation = UserRoleModel(
            user_id=user.id,
            role_id=user_role.id
        )
        
        self.db.add(user_role_relation)
        await self.db.commit()
        
        return await self.get_user_with_relations(user.id)
    
    
    # Authenticatie User method
    async def authenticate_user(
        self,
        schema: LoginDTO
    ) -> UserModel:
        """Аунтентификация: поиск пользователя и проверка пароля"""
        
        query = (
            select(UserModel)
            .where(UserModel.email == schema.email)
        )
        
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        # Если юсер не найден
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Валидация пароля
        valid_password = verify_password(schema.password, user.password_hash)
        
        if not valid_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return user
    
    
    async def get_user_with_relations(
        self,
        user_id: str
    ) -> UserModel:
        
        # Relationship
        query = (
            select(UserModel)
            .options(
                selectinload(UserModel.roles)
                .selectinload(UserRoleModel.role)
            )
            .where(UserModel.id == user_id)
        )
        
        result = await self.db.execute(query)
        return result.scalar_one()
    