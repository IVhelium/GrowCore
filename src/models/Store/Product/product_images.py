import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.custom_types import intPk
from src.database import Base

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id: Mapped[intPk] = mapped_column(primary_key=True, autoincrement=True)
    image: Mapped[str]
    
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    
    product = relationship("Product", back_populates="imagea")