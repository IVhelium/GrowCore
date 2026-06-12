from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings


# ======= Creating a database engine and sessions for working with the database ======= #

engine = create_async_engine(               # Create an async engine for connecting to a PostgreSQL database
    url=settings.DATABASE_URL_asyncpg,      # Connection link
    echo=False,                             # It will display all SQL queries in the console
    pool_size=5,                            # Standard maximum number of connections to the database
    max_overflow=10,                        # Maximum number of connections to the database
    pool_pre_ping=True,                     # Functionality check before use
)  

new_session = async_sessionmaker(           # Create an async sessionmaker for managing database
    engine, 
    expire_on_commit=False
)  

async def get_session():
    async with new_session() as session:
        yield session
         
         
class Base(DeclarativeBase):
    # Relationships are not used in `repr()` because they can lead to unexpected reloads
    
    repr_cols_num = 3
    repr_cols = tuple()
    
    def __repr__(self):
        cols = []
        
        for idx, col in enumerate(self.__table__.columns.keys()):
            if col in self.repr_cols or idx < self.repr_cols_num:
                cols.append(f"{col}={getattr(self, col)}")
        
        return f"<{self.__class__.__name__} {', '.join(cols)}>"