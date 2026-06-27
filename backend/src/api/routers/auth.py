from fastapi import APIRouter, Depends, Response, status
from authx import TokenPayload
from src.core.dependencies import AuthServiceDependency, CurrentUserDependency
from src.core.security import auth
from src.schemas import ReadUserDTO, RegisterDTO, LoginDTO, TokenResponseDTO


# This router exposes the endpoints used to register, sign in, refresh a session, and sign out.
router = APIRouter(
    prefix="/auths", 
    tags=["Auths"]
)


# Creates a new account and gives it the default user role.
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


# Checks the user's credentials and stores access and refresh tokens in secure cookies.
@router.post(
    "/login",
    response_model=TokenResponseDTO
)
async def login(
    dto: LoginDTO,
    response: Response,
    auth_service: AuthServiceDependency
):
    # The service confirms that the email and password belong to the same user.
    user = await auth_service.authenticate_user(dto)
    
    access_token = auth.create_access_token(uid=str(user.id))
    refresh_token = auth.create_refresh_token(uid=str(user.id))
    
    auth.set_access_cookies(access_token, response=response)
    auth.set_refresh_cookies(refresh_token, response=response)
    
    return {"message": "Success"}


# Creates a new access token when the browser still has a valid refresh token.
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


# Returns the profile of the user identified by the current access token.
@router.get(
    "/me",
    response_model=ReadUserDTO
)
async def me(current_user: CurrentUserDependency):
    return current_user


# Removes both authentication cookies to end the user's session in this browser.
@router.post(
    "/logout",
    response_model=TokenResponseDTO
)
async def logout(response: Response, _current_user: CurrentUserDependency):
    auth.unset_access_cookies(response=response)
    auth.unset_refresh_cookies(response=response)
    
    return {"message": "Success"}
