import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from src.database import Base

def generate_public_id():
    return "#" + uuid.uuid4().hex[:8]    # Ограничивает айди до 8 символов

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)  # uuid4 генирирует полностью случайные числа
    public_id: Mapped[str] = mapped_column(String(16), default=generate_public_id, index=True, unique=True)
    username: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    password_hash: Mapped[str]
    
    avatar_url: Mapped[str | None]
    description: Mapped[str | None]
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    followers_count: Mapped[int] = mapped_column(default=0)
    following_count: Mapped[int] = mapped_column(default=0)
    
    roles = relationship("UserRole", back_populates="user")