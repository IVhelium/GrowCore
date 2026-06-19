from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi import Response
from src.core.constants import PUBLIC_ID_RE
from src.core.dependencies import (
    AdminDependency,
    ChatServiceDependency,
    CurrentUserDependency,
    NotificationServiceDependency,
    UserServiceDependency,
)
from src.core.pagination import PaginationDependency
from src.schemas import (
    CreateUserChatMessageDTO,
    CreateFriendRequestDTO,
    FriendshipStatusDTO,
    PaginationDTO,
    PublicUserDTO,
    ReadNotificationDTO,
    ReadUserChatMessageDTO,
    ReadUserDTO,
    ShortUserDTO,
    UserFriendRequestDTO,
    UpdateUserDTO,
    UserChatThreadDTO,
    BlockUserDTO
)


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
    search: str | None = Query(default=None, max_length=64),
):
    return await user_service.list_users(pagination=pagination, search=search)


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


@router.get(
    "/me/friends",
    response_model=PaginationDTO[ShortUserDTO],
)
async def list_my_friends(
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
    pagination: PaginationDependency,
    search: str | None = Query(default=None, max_length=64),
):
    return await user_service.list_friends(
        current_user=current_user,
        pagination=pagination,
        search=search,
    )


@router.get(
    "/me/friend-requests",
    response_model=list[UserFriendRequestDTO],
)
async def list_my_friend_requests(
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.list_friend_requests(current_user=current_user)


@router.get(
    "/me/friend-requests/count",
    response_model=dict[str, int],
)
async def get_my_friend_request_count(
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return {"count": await user_service.friend_request_count(current_user)}


@router.post(
    "/me/friend-requests/{request_id}/accept",
    response_model=UserFriendRequestDTO,
)
async def accept_my_friend_request(
    request_id: int,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.accept_friend_request(
        current_user=current_user,
        request_id=request_id,
    )


@router.post(
    "/me/friend-requests/{request_id}/decline",
    response_model=UserFriendRequestDTO,
)
async def decline_my_friend_request(
    request_id: int,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.decline_friend_request(
        current_user=current_user,
        request_id=request_id,
    )


@router.get(
    "/me/chats",
    response_model=list[UserChatThreadDTO],
)
async def list_my_chats(
    current_user: CurrentUserDependency,
    chat_service: ChatServiceDependency,
):
    return await chat_service.list_threads(current_user=current_user)


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


@router.delete(
    "/me/notifications",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_all_my_notifications(
    current_user: CurrentUserDependency,
    notification_service: NotificationServiceDependency,
):
    await notification_service.delete_all(current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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


@router.get(
    "/{public_id}/friendship",
    response_model=FriendshipStatusDTO,
)
async def get_friendship_status(
    public_id: str,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.get_friendship_status(
        current_user=current_user,
        public_id=public_id,
    )


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


@router.post(
    "/{public_id}/friend",
    response_model=PublicUserDTO,
)
async def add_friend(
    public_id: str,
    schema: CreateFriendRequestDTO,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.add_friend(
        current_user=current_user,
        public_id=public_id,
        message=schema.message,
    )


@router.delete(
    "/{public_id}/friend",
    response_model=PublicUserDTO,
)
async def remove_friend(
    public_id: str,
    current_user: CurrentUserDependency,
    user_service: UserServiceDependency,
):
    return await user_service.remove_friend(
        current_user=current_user,
        public_id=public_id,
    )


@router.get(
    "/{public_id}/chat",
    response_model=list[ReadUserChatMessageDTO],
)
async def list_user_chat_messages(
    public_id: str,
    current_user: CurrentUserDependency,
    chat_service: ChatServiceDependency,
):
    return await chat_service.list_messages(
        current_user=current_user,
        public_id=public_id,
    )


@router.post(
    "/{public_id}/chat",
    response_model=ReadUserChatMessageDTO,
    status_code=status.HTTP_201_CREATED,
)
async def send_user_chat_message(
    public_id: str,
    schema: CreateUserChatMessageDTO,
    current_user: CurrentUserDependency,
    chat_service: ChatServiceDependency,
):
    return await chat_service.send_message(
        current_user=current_user,
        public_id=public_id,
        schema=schema,
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
