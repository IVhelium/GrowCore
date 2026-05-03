from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base

class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str]
    
    products = relationship("Product", back_populates="category")