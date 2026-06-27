from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings


# ======= Creating a database engine and sessions for working with the database ======= #

engine = create_async_engine(               # Create an async engine for connecting to a PostgreSQL database
    url=settings.DATABASE_URL_asyncpg,      # Connection link
    echo=False,                             # It will display all SQL queries in the console
    pool_size=settings.DB_POOL_SIZE,        # Keep the pool small for hosted Postgres free tiers
    max_overflow=settings.DB_MAX_OVERFLOW,  # Extra temporary connections allowed above pool_size
    pool_pre_ping=True,                     # Functionality check before use
)  

new_session = async_sessionmaker(           # Create an async sessionmaker for managing database
    engine, 
    expire_on_commit=False
)  

# Opens one database session for a request and closes it afterwards.
async def get_session():
    async with new_session() as session:
        yield session
         
         
class Base(DeclarativeBase):
    """Base class inherited by every database model in the project."""
    # Relationships are not used in `repr()` because they can lead to unexpected reloads
    
    repr_cols_num = 3
    repr_cols = tuple()
    
    def __repr__(self):
        """Returns a short model description that is useful when debugging."""
        cols = []
        
        for idx, col in enumerate(self.__table__.columns.keys()):
            if col in self.repr_cols or idx < self.repr_cols_num:
                cols.append(f"{col}={getattr(self, col)}")
        
        return f"<{self.__class__.__name__} {', '.join(cols)}>"
