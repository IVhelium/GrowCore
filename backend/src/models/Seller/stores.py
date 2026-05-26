import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import uuidPk, createdAt
from src.core.database import Base

class StoreModel(Base):
    __tablename__ = "stores"
    
    id: Mapped[uuidPk]
    name: Mapped[str]
    description: Mapped[str | None]
       
    created_at: Mapped[createdAt]
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Relationships
    user: Mapped["UserModel"] = relationship(
        back_populates="store",
        uselist=False
    )
    
    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="store"
    )