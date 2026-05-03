import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base

class UserRole(Base):
    __tablename__ = "user_roles"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    
    user = relationship("User", back_populates="roels")
    role = relationship("Role", back_populates="users")
    