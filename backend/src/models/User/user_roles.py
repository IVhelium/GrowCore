import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.src.core.custom_types import intPk
from backend.src.core.database import Base

class UserRoleModel(Base):
    __tablename__ = "user_roles"
    
    id: Mapped[intPk]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="roles"
    )
    
    role: Mapped["RoleModel"] = relationship(
        back_populates="users"
    )
    