import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base

class ProductImageModel(Base):
    __tablename__ = "product_images"
    
    id: Mapped[intPk]
    image: Mapped[str]
    
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    product = relationship("ProductModel", back_populates="images")