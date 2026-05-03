import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base

class UserRole(Base):
    __tablename__ = "user_roles"
    
    id: Mapped[intPk]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    
    user = relationship("User", back_populates="roels")
    role = relationship("Role", back_populates="users")
    