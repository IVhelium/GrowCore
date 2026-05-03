import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base


class RoleStatus(enum.Enum):
    user = "User"
    seller = "Seller"
    admin = "Admin"

class Role(Base):
    __tablename__ = "roles"
    
    id: Mapped[intPk]
    role: Mapped[RoleStatus]
    
    users = relationship("UserRole", back_populates="role")