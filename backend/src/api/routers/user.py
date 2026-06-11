from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.core.constants import PUBLIC_ID_RE
from src.core.dependencies import (
    AdminDependency,
    CurrentUserDependency,
    NotificationServiceDependency,
    UserServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import PaginationDTO, PublicUserDTO, ReadNotificationDTO, ReadUserDTO, UpdateUserDTO, ShortUserDTO


class BlockUserDTO(BaseModel):
    reason: str = Field(min_length=10, max_length=400)

    @field_validator("reason", mode="before")
    @classmethod
    def trim_reason(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    model_config = ConfigDict(extra="forbid")


router = APIRouter(
    prefix="/users", 
    tags=["Users"]
)


@router.get(
    "",
    response_model=PaginationDTO[ShortUserDTO],
)
async def list_users(
    user_service: UserServiceDependency,
    pagination: PaginationDependency,
):
    return await user_service.list_users(pagination=pagination)


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
    "/me/notifications",
    response_model=PaginationDTO[ReadNotificationDTO],
)
async def list_my_notifications(
    current_user: CurrentUserDependency,
    notification_service: NotificationServiceDependency,
    pagination: PaginationDependency,
):
    return await notification_service.list_notifications(
        current_user=current_user,
        pagination=pagination,
    )


@router.get(
    "/me/notifications/unread-count",
    response_model=dict[str, int],
)
async def get_my_notification_unread_count(
    current_user: CurrentUserDependency,
    notification_service: NotificationServiceDependency,
):
    return {"count": await notification_service.unread_count(current_user)}


@router.patch(
    "/me/notifications/read-all",
    response_model=dict[str, int],
)
async def mark_all_my_notifications_read(
    current_user: CurrentUserDependency,
    notification_service: NotificationServiceDependency,
):
    return {"updated": await notification_service.mark_all_read(current_user)}


@router.patch(
    "/me/notifications/{notification_id}/read",
    response_model=ReadNotificationDTO,
)
async def mark_my_notification_read(
    notification_id: int,
    current_user: CurrentUserDependency,
    notification_service: NotificationServiceDependency,
):
    return await notification_service.mark_read(
        current_user=current_user,
        notification_id=notification_id,
    )


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


@router.patch(
    "/admin/{public_id}/block",
    response_model=PublicUserDTO,
)
async def block_user(
    public_id: str,
    schema: BlockUserDTO,
    admin: AdminDependency,
    user_service: UserServiceDependency,
):
    return await user_service.set_user_block(
        public_id=public_id,
        blocked=True,
        reason=schema.reason,
    )


@router.patch(
    "/admin/{public_id}/unblock",
    response_model=PublicUserDTO,
)
async def unblock_user(
    public_id: str,
    admin: AdminDependency,
    user_service: UserServiceDependency,
):
    return await user_service.set_user_block(
        public_id=public_id,
        blocked=False,
    )


@router.get(
    "/{public_id}/following",
    response_model=dict[str, bool],
)
async def get_following_status(
    public_id: str,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return {
        "is_following": await user_service.is_following(
            current_user=current_user,
            public_id=public_id,
        )
    }


@router.post(
    "/{public_id}/follow",
    response_model=PublicUserDTO,
)
async def follow_user(
    public_id: str,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.follow_user(
        current_user=current_user,
        public_id=public_id,
    )


@router.delete(
    "/{public_id}/follow",
    response_model=PublicUserDTO,
)
async def unfollow_user(
    public_id: str,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.unfollow_user(
        current_user=current_user,
        public_id=public_id,
    )


@router.get(
    "/{public_id}",
    response_model=PublicUserDTO,
)
async def get_public_user_profile(
    user_service: UserServiceDependency,
    public_id: str,
):
    return await user_service.get_user_by_public_id(public_id=public_id)
