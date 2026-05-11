from sqlalchemy.orm import Mapped, relationship
from src.custom_types import intPk
from src.database import Base

class CategoryModel(Base):
    __tablename__ = "categories"
    
    id: Mapped[intPk]
    name: Mapped[str]
    
    # Relationships
    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="category"
    )