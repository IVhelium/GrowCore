# SQLAlchemy
from unittest.mock import Base
from sqlalchemy.orm import Mapped, mapped_column


class BookModel(Base):  # Create model for table books
    __tablename__ = "books"  # Define the name of the database table for books
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    author: Mapped[str]