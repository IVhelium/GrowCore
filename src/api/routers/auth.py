from fastapi import APIRouter, HTTPException, Response, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.core.dependencies import SessionDependency, get_current_user, get_auth_service
from src.core.security import auth
from src.api.services.auth import AuthService
from src.core.security import auth, hash_password, verify_password
from src.models import UserModel, RoleModel, UserRoleModel
from src.schemas import ReadUserDTO, RegisterDTO, LoginDTO, TokenResponseDTO


router = APIRouter(prefix="/auths", tags=["Auths"])


# Register new User
@router.post(
    "/register", 
    response_model=ReadUserDTO, 
    status_code=status.HTTP_201_CREATED
)
async def register(
    schema: RegisterDTO, 
    auth_service: AuthService = Depends(get_auth_service)
):
    return await auth_service.register_new_user(schema)


# Login User
@router.post(
    "/login",
    response_model=TokenResponseDTO
)
async def login(
    schema: LoginDTO,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.authenticate_user(schema)
    
    access_token = auth.create_access_token(uid=str(user.id))
    auth.set_access_cookies(access_token, response=response)
    
    return {"message": "Success"}


# Current User
@router.get(
    "/me",
    response_model=ReadUserDTO
)
async def me(current_user=Depends(get_current_user)):
    return current_user


# Logout
@router.post(
    "/logout",
    response_model=TokenResponseDTO
)
async def logout(response: Response):
    auth.unset_access_cookies(response=response)
    
    return {"message": "Success"}