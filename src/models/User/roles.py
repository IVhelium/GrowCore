import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base


class RoleStatus(enum.Enum):
    user = "User"
    seller = "Seller"
    admin = "Admin"

class Role(Base):
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role: Mapped[RoleStatus]
    
    users = relationship("UserRole", back_populates="role")