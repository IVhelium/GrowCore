from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import uuidPk, createdAt
from src.database import Base

class Store(Base):
    __tablename__ = "stores"
    
    id: Mapped[uuidPk]
    name: Mapped[str]
    description: Mapped[str | None]
       
    created_at: Mapped[createdAt]
    
    products = relationship("Product", back_populates="store")