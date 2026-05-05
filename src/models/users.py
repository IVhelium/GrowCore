import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import uuidPk, createdAt
from src.database import Base

def generate_public_id():
    return "#" + uuid.uuid4().hex[:8]    # Ограничивает айди до 8 символов

class UserModel(Base):
    __tablename__ = "users"
    
    id: Mapped[uuidPk]
    public_id: Mapped[str] = mapped_column(String(8), default=generate_public_id, index=True, unique=True)
    username: Mapped[str] = mapped_column(String(25), unique=True)
    email: Mapped[str] = mapped_column(String(256), unique=True)
    password_hash: Mapped[str]
    
    avatar_url: Mapped[str | None]
    description: Mapped[str | None] = mapped_column(String(300))
    
    created_at: Mapped[createdAt]
    
    followers_count: Mapped[int] = mapped_column(default=0)
    following_count: Mapped[int] = mapped_column(default=0)
    
    roles = relationship("UserRoleModel", back_populates="user")