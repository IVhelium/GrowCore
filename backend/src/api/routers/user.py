from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from src.core.constants import PUBLIC_ID_RE
from src.core.dependencies import (
    CurrentUserDependency,
    UserServiceDependency,
)
from src.schemas import PublicUserDTO, ReadUserDTO, UpdateUserDTO, ShortUserDTO


router = APIRouter(
    prefix="/users", 
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=ReadUserDTO
)
async def get_me(
    current_user: CurrentUserDependency
):
    return current_user


@router.patch(
    "/me",
    response_model=ReadUserDTO
)
async def update_me(
    dto: UpdateUserDTO,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency
):
    return await user_service.update_current_user(current_user=current_user, schema=dto)


@router.patch(
    "/me/avatar",
    response_model=ReadUserDTO,
    status_code=status.HTTP_200_OK
)
async def upload_my_avatar(
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
    avatar: Annotated[UploadFile | None, File()] = None,
    file: Annotated[UploadFile | None, File()] = None,
):
    uploaded_avatar = avatar or file

    if uploaded_avatar is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar file is required",
        )

    return await user_service.upload_avatar(current_user=current_user, avatar=uploaded_avatar)


@router.delete(
    "/me/avatar",
    response_model=ReadUserDTO
)
async def delete_my_avatar(
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency
):
    return await user_service.delete_avatar(current_user=current_user)


@router.get(
    "/search",
    response_model=ShortUserDTO
)
async def get_user_by_public_id(
    user_service: UserServiceDependency,
    public_id: Annotated[
        str,
        Query(
            ...,
            min_length=10,
            max_length=11,
            pattern=PUBLIC_ID_RE
        )
    ]
):
    return await user_service.get_user_by_public_id(public_id=public_id)


@router.get(
    "/{public_id}",
    response_model=PublicUserDTO,
)
async def get_public_user_profile(
    user_service: UserServiceDependency,
    public_id: str,
):
    return await user_service.get_user_by_public_id(public_id=public_id)
