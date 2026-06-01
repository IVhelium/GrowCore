from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import UserModel, RoleModel, UserRoleModel
from src.schemas import RegisterDTO, LoginDTO
from src.core.security import hash_password, verify_password
from src.core.constants import RoleStatus


class AuthService:
    def __init__(
        self,
        db: AsyncSession
    ):
        self.db = db


    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass
       
        
    # Redister new User method  
    async def register_new_user(
        self,
        schema: RegisterDTO  
    ) -> UserModel:
        """New user registration with duplicate check and role assignment"""
        
        # Check email | username
        exist_query = (
            select(UserModel)
            .where((UserModel.email == schema.email) | (UserModel.username == schema.username))
        )
        
        try:
            exist_result = await self.db.execute(exist_query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not check existing user"
            ) from exc

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
        
        try:
            role_result = await self.db.execute(role_query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load user role"
            ) from exc

        user_role = role_result.scalar_one_or_none()

        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default user role is not configured"
            )
        
        
        # Create User
        user = UserModel(
            username=schema.username,
            email=schema.email,
            password_hash=hash_password(schema.password)
        )
        
        try:
            self.db.add(user)
            await self.db.flush()
            
            
            # User Role Relation
            user_role_relation = UserRoleModel(
                user_id=user.id,
                role_id=user_role.id
            )
            
            self.db.add(user_role_relation)
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exist"
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not register user"
            ) from exc
        
        return await self.get_user_with_relations(user.id)
    
    
    # Authenticatie User method
    async def authenticate_user(
        self,
        schema: LoginDTO
    ) -> UserModel:
        """Authentication: User Lookup and Password Verification"""
        
        query = (
            select(UserModel)
            .where(UserModel.email == schema.email)
        )
        
        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not authenticate user"
            ) from exc

        user = result.scalar_one_or_none()
        
        # If the user is not found
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Password validation
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
        
        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load user"
            ) from exc

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return user
    
