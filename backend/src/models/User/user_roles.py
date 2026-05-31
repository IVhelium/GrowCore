import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import intPk
from src.core.database import Base

class UserRoleModel(Base):
    __tablename__ = "user_roles"
    
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )
    
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
    