from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.core.dependencies import SessionDependency, get_current_user
from src.core.security import auth, hash_password, verify_password
from src.models import UserModel, RoleModel, RoleStatus, UserRoleModel
from src.schemas import ReadUserDTO, RegisterDTO, LoginDTO, TokenResponseDTO


router = APIRouter(prefix="/auth", tags=["Auths"])


# Register
@router.post("/register", response_model=ReadUserDTO, status_code=status.HTTP_201_CREATED)
async def register(schema: RegisterDTO, db: SessionDependency):
    
    # Check email
    email_query = (
        select(UserModel)
        .where(UserModel.email == schema.email)
    )
    
    email_result = await db.execute(email_query)
    email_exist = email_result.scalar_one_or_none()
    
    if email_exist:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email alredy exist"
        )
        
    
    # Check username
    username_query = (
        select(UserModel)
        .where(UserModel.username == schema.username)
    )
    
    username_result = await db.execute(username_query)
    username_exist = username_result.scalar_one_or_none()
    
    if username_exist:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username alredy exist"
        )
    
    
    # Get User Role
    role_query = (
        select(UserModel)
        .options(
            selectinload(UserModel.roles)
        )
        .where(UserModel.roles.any(RoleModel.role == RoleStatus.user))
    )
    
    role_result = await db.execute(role_query)
    user_role = role_result.scalar_one_or_none()
    
    
    # Create User
    user = UserModel(
        username=schema.username,
        email=schema.email,
        password_hash=hash_password(schema.password)
    )
    
    db.add(user)   
    await db.flush()
    
    # Add Role
    user_role_relation = UserRoleModel(
        user_id=user.id,
        role_id=user_role.id
    )
    
    db.add(user_role_relation)
    await db.commit()
    
    query = (
        select(UserModel)
        .options(
            selectinload(UserModel.roles)
            .selectinload(UserRoleModel.role)
        )
        .where(UserModel.id == user.id)
    )
    
    result = await db.execute(query)
    created_user = result.scalar_one()
    
    return created_user