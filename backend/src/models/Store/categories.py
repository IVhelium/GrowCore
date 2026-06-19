from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.custom_types import intPk
from src.core.database import Base

class CategoryModel(Base):
    __tablename__ = "categories"
    
    id: Mapped[intPk]
    name: Mapped[str]
    image_url: Mapped[str]
    icon_name: Mapped[str] = mapped_column(String(80), default="SlidersHorizontal")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    products: Mapped[list["ProductModel"]] = relationship(
        back_populates="category"
    )
