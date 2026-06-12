from fastapi import APIRouter, Depends, Response, status
from authx import TokenPayload
from src.core.dependencies import AuthServiceDependency, CurrentUserDependency
from src.core.security import auth
from src.schemas import ReadUserDTO, RegisterDTO, LoginDTO, TokenResponseDTO


router = APIRouter(
    prefix="/auths", 
    tags=["Auths"]
)


# Register new User
@router.post(
    "/register", 
    response_model=ReadUserDTO, 
    status_code=status.HTTP_201_CREATED
)
async def register(
    dto: RegisterDTO, 
    auth_service: AuthServiceDependency
):
    return await auth_service.register_new_user(dto)


# Login User
@router.post(
    "/login",
    response_model=TokenResponseDTO
)
async def login(
    dto: LoginDTO,
    response: Response,
    auth_service: AuthServiceDependency
):
    user = await auth_service.authenticate_user(dto)
    
    access_token = auth.create_access_token(uid=str(user.id))
    refresh_token = auth.create_refresh_token(uid=str(user.id))
    
    auth.set_access_cookies(access_token, response=response)
    auth.set_refresh_cookies(refresh_token, response=response)
    
    return {"message": "Success"}


# Refresh JWT Token
@router.post(
    "/refresh",
    response_model=TokenResponseDTO
)
async def refresh_token(
    response: Response,
    payload: TokenPayload = Depends(auth.refresh_token_required)
):
    new_access_token = auth.create_access_token(uid=str(payload.sub)) 
    auth.set_access_cookies(new_access_token, response=response)
    
    return {"message": "Access token refreshed"}


# Current User
@router.get(
    "/me",
    response_model=ReadUserDTO
)
async def me(current_user: CurrentUserDependency):
    return current_user


# Logout
@router.post(
    "/logout",
    response_model=TokenResponseDTO
)
async def logout(response: Response):
    auth.unset_access_cookies(response=response)
    auth.unset_refresh_cookies(response=response)
    
    return {"message": "Success"}