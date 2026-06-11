from fastapi import HTTPException, UploadFile, status
from datetime import datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.utils.storage_paths import avatar_directory_key
from src.api.services.files.file_storage import FileStorageService
from src.core.upload_policies import AVATAR_POLICY
from src.core.constants import PUBLIC_ID_RE
from src.core.pagination import PaginationParams, PaginationService
from src.api.services.notification import NotificationService
from src.models import NotificationModel, UserFollowEventModel, UserFollowModel, UserModel, UserRoleModel
from src.schemas import UpdateUserDTO


class UserService:
    def __init__(
        self,
        db: AsyncSession,
        file_storage_service: FileStorageService
    ):
        self.db = db
        self.file_storage_service = file_storage_service


    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass

    
    @staticmethod
    def normalize_public_id(public_id: str) -> str:  # Normalizing public data to the correct type
        value = public_id.strip().upper()
        
        if not value.startswith("#"):                # If the ID doesn't start with a hashtag, it adds one at the beginning of the ID
            value = f"#{value}"
            
        if not PUBLIC_ID_RE.fullmatch(value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid public_id format. Example: #A1B2C3D4E5"
            )
            
        return value

    async def _ensure_follow_rate_limit(
        self,
        current_user: UserModel,
        target: UserModel,
    ) -> None:
        since = datetime.utcnow() - timedelta(hours=1)
        actions = await self.db.scalar(
            select(func.count())
            .select_from(UserFollowEventModel)
            .where(
                UserFollowEventModel.follower_id == current_user.id,
                UserFollowEventModel.following_id == target.id,
                UserFollowEventModel.created_at >= since,
            )
        ) or 0

        if actions >= 6:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many follow actions. Please try again later.",
            )

    def _record_follow_event(
        self,
        current_user: UserModel,
        target: UserModel,
        action: str,
    ) -> None:
        self.db.add(
            UserFollowEventModel(
                follower_id=current_user.id,
                following_id=target.id,
                action=action,
            )
        )
    
    
    # Retrieving a user with roles
    async def get_user_with_relations(
        self,
        user_id: str
    ) -> UserModel:
        
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
    
    
    # Retrieving a user by public ID
    async def get_user_by_public_id(
        self,
        public_id: str  
    ) -> UserModel:
        
        normalize_public_id = self.normalize_public_id(public_id)
        
        query = (
            select(UserModel)
            .options(
                selectinload(UserModel.roles)
                .selectinload(UserRoleModel.role)
            )
            .where(UserModel.public_id == normalize_public_id)
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

    async def is_following(
        self,
        current_user: UserModel,
        public_id: str,
    ) -> bool:
        target = await self.get_user_by_public_id(public_id)

        result = await self.db.execute(
            select(UserFollowModel)
            .where(
                UserFollowModel.follower_id == current_user.id,
                UserFollowModel.following_id == target.id,
            )
        )

        return result.scalar_one_or_none() is not None

    async def follow_user(
        self,
        current_user: UserModel,
        public_id: str,
    ) -> UserModel:
        target = await self.get_user_by_public_id(public_id)

        if target.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You cannot follow yourself",
            )

        await self._ensure_follow_rate_limit(current_user, target)

        result = await self.db.execute(
            select(UserFollowModel)
            .where(
                UserFollowModel.follower_id == current_user.id,
                UserFollowModel.following_id == target.id,
            )
        )

        if result.scalar_one_or_none():
            return target

        self._record_follow_event(current_user, target, "follow")
        self.db.add(
            UserFollowModel(
                follower_id=current_user.id,
                following_id=target.id,
            )
        )
        target.followers_count += 1
        current_user.following_count += 1
        follow_message = f"{current_user.username} started following you."
        recent_notification = await self.db.scalar(
            select(NotificationModel)
            .where(
                NotificationModel.user_id == target.id,
                NotificationModel.title == "New follower",
                NotificationModel.message == follow_message,
                NotificationModel.created_at >= datetime.utcnow() - timedelta(days=1),
            )
        )

        if not recent_notification:
            await NotificationService(self.db).create(
                user_id=target.id,
                title="New follower",
                message=follow_message,
            )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not follow user",
            ) from exc

        return await self.get_user_by_public_id(public_id)

    async def unfollow_user(
        self,
        current_user: UserModel,
        public_id: str,
    ) -> UserModel:
        target = await self.get_user_by_public_id(public_id)

        result = await self.db.execute(
            select(UserFollowModel)
            .where(
                UserFollowModel.follower_id == current_user.id,
                UserFollowModel.following_id == target.id,
            )
        )
        relation = result.scalar_one_or_none()

        if not relation:
            return target

        await self._ensure_follow_rate_limit(current_user, target)
        self._record_follow_event(current_user, target, "unfollow")
        await self.db.delete(relation)
        target.followers_count = max(0, target.followers_count - 1)
        current_user.following_count = max(0, current_user.following_count - 1)

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not unfollow user",
            ) from exc

        return await self.get_user_by_public_id(public_id)

    async def list_users(
        self,
        pagination: PaginationParams,
    ):
        query = (
            select(UserModel)
            .options(
                selectinload(UserModel.roles)
                .selectinload(UserRoleModel.role)
            )
            .order_by(UserModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def set_user_block(
        self,
        public_id: str,
        blocked: bool,
        reason: str | None = None,
    ) -> UserModel:
        user = await self.get_user_by_public_id(public_id)
        trimmed_reason = reason.strip() if reason else None

        if blocked and not trimmed_reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Block reason is required",
            )

        user.is_blocked = blocked
        user.block_reason = trimmed_reason if blocked else None

        if blocked:
            await NotificationService(self.db).create(
                user_id=user.id,
                title="Account blocked",
                message=(
                    "Your GrowCore account was blocked by an administrator. "
                    f"Reason: {trimmed_reason}"
                ),
            )
        else:
            await NotificationService(self.db).create(
                user_id=user.id,
                title="Account restored",
                message="Your GrowCore account is active again.",
            )

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update user status",
            ) from exc

        return await self.get_user_by_public_id(public_id)

    async def list_notifications(
        self,
        current_user: UserModel,
        pagination: PaginationParams,
    ):
        query = (
            select(NotificationModel)
            .where(NotificationModel.user_id == current_user.id)
            .order_by(NotificationModel.created_at.desc())
        )

        return await PaginationService.paginate(
            db=self.db,
            query=query,
            pagination=pagination,
        )

    async def mark_notification_read(
        self,
        current_user: UserModel,
        notification_id: int,
    ) -> NotificationModel:
        query = (
            select(NotificationModel)
            .where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == current_user.id,
            )
        )

        result = await self.db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        notification.read_at = datetime.utcnow()

        try:
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark notification as read",
            ) from exc

        return notification
    
    
    # Method for updating current user
    async def update_current_user(
        self,
        current_user: UserModel,
        schema: UpdateUserDTO
    ) -> UserModel:
        
        data = schema.model_dump(exclude_unset=True)    # Converts the schema into a dictionary
        
        if not data:
            return await self.get_user_with_relations(current_user.id)
        
        username = data.get("username")                 # Retrieves the username from the schema
        
        if username is not None:
            normalized_username = username.strip()
            
            if not normalized_username:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Username cannot be empty"
                )  
               
            # If the username has been changed, check the database for existing entries
            if normalized_username != current_user.username:
                query = (
                    select(UserModel)
                    .where(
                        UserModel.username == normalized_username,
                        UserModel.id != current_user.id
                    )
                )
                
                try:
                    result = await self.db.execute(query)

                except SQLAlchemyError as exc:
                    await self._safe_rollback()

                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Could not check username"
                    ) from exc

                user_exists = result.scalar_one_or_none()
                
                if user_exists:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Username already exists"
                    )
                    
            data["username"] = normalized_username
            
        # Updating the object
        for field, value in data.items():
            setattr(current_user, field, value)
           
        self.db.add(current_user)
            
        try:
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User update conflict"
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update user"
            ) from exc
            
        return await self.get_user_with_relations(current_user.id)
        
    
    # Method for upload an avatar
    async def upload_avatar(
        self,
        current_user: UserModel,
        avatar: UploadFile
    ) -> UserModel:
        """Uploads a new avatar for the user; if one already exists, it adds the new one and deletes the old one"""
        
        old_avatar_url = current_user.avatar_url
        
        stored_file = await self.file_storage_service.save_file(
            file=avatar,
            policy=AVATAR_POLICY,
            directory_key=avatar_directory_key(current_user)
        )
        
        if stored_file.public_url is None:
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=AVATAR_POLICY
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Avatar public URL is not configured"
            )
        
        current_user.avatar_url = stored_file.public_url
        
        try:
            await self.db.commit()
            
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=AVATAR_POLICY
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar was saved, but profile update failed"
            ) from exc
            
        self.file_storage_service.delete_by_public_url(
            public_url=old_avatar_url,
            policy=AVATAR_POLICY
        )
        
        return await self.get_user_with_relations(current_user.id)
    
    
    # Method for removing an avatar
    async def delete_avatar(
        self,
        current_user: UserModel
    ) -> UserModel:
        """Deletes the current user's avatar. First, the avatar is deleted from the database. After a successful commit, it is deleted from disk."""
        
        old_avatar_url = current_user.avatar_url
        
        if old_avatar_url is None:
            return await self.get_user_with_relations(current_user.id)
        
        current_user.avatar_url = None
        
        try:
            await self.db.commit()
            
        except SQLAlchemyError as exc:
            await self._safe_rollback()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar delete failed"
            ) from exc
            
        self.file_storage_service.delete_by_public_url(
            public_url=old_avatar_url,
            policy=AVATAR_POLICY
        )
        
        return await self.get_user_with_relations(current_user.id)
