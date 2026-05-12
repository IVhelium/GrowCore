from sqlalchemy.orm import Mapped, relationship
from src.core.custom_types import intPk
from src.core.database import Base

class CategoryModel(Base):
    __tablename__ = "categories"
    
    id: Mapped[intPk]
    name: Mapped[str]
    
    # Relationships
    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="category"
    )