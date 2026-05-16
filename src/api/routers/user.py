from typing import Annotated

from sqlalchemy import select
from fastapi import APIRouter, Query, status
from src.core.constants import PUBLIC_ID_RE
from src.core.dependencies import (
    CurrentUserDependency,
    AvatarFileDependency,
    UserServiceDependency,
)
from src.api.services.avatar import AvatarService
from src.models import UserModel
from src.schemas import CreateUserDTO, ReadUserDTO, UpdateUserDTO, ShortUserDTO


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
    avatar: AvatarFileDependency
):
    return await user_service.upload_avatar(current_user=current_user, avatar=avatar)


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