from sqlalchemy.orm import Mapped, relationship
from backend.src.core.custom_types import intPk
from backend.src.core.database import Base

class CategoryModel(Base):
    __tablename__ = "categories"
    
    id: Mapped[intPk]
    name: Mapped[str]
    image_url: Mapped[str]
    
    # Relationships
    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="category"
    )