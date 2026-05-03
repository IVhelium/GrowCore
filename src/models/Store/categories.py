from sqlalchemy.orm import Mapped, relationship
from src.custom_types import intPk
from src.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[intPk]
    name: Mapped[str]
    
    products = relationship("Product", back_populates="category")