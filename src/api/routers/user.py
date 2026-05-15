from sqlalchemy import select
from fastapi import APIRouter
from src.core.dependencies import (
    validate_avatar_upload,
    get_avatar_service,
    get_current_user
)
from src.api.services.avatar import AvatarService
from src.models import UserModel
from src.schemas import CreateUserDTO, ReadUserDTO


router = APIRouter(
    prefix="/users", 
    tags=["Users"]
)