import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base


class RoleStatus(enum.Enum):
    user = "User"
    seller = "Seller"
    admin = "Admin"

class RoleModel(Base):
    __tablename__ = "roles"
    
    id: Mapped[intPk]
    role: Mapped[RoleStatus] = mapped_column(default=RoleStatus.user)
    
    users: Mapped[list["UserRoleModel"]] = relationship(back_populates="role")