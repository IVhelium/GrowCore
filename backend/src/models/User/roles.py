from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.constants import RoleStatus
from src.core.custom_types import intPk
from src.core.database import Base



class RoleModel(Base):
    __tablename__ = "roles"
    
    id: Mapped[intPk]
    role: Mapped[RoleStatus] = mapped_column(default=RoleStatus.user, unique=True)
    
    # Relationships
    users: Mapped[list["UserRoleModel"]] = relationship(
        back_populates="role",
    )