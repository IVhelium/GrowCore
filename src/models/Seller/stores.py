import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from src.database import Base

class Store(Base):
    __tablename__ = "stores"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str]
    description: Mapped[str | None]
       
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    
    products = relationship("Product", back_populates="store")