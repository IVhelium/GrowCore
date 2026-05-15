from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.constants import RoleStatus
from src.core.custom_types import intPk
from src.core.database import Base



class RoleModel(Base):
    __tablename__ = "roles"
    
    id: Mapped[intPk]
    role: Mapped[RoleStatus] = mapped_column(default=RoleStatus.user)
    
    # Relationships
    users: Mapped[list["UserRoleModel"]] = relationship(
        secondary="user_roles",
        back_populates="role",
    )