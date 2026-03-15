from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


engine = create_async_engine('sqlite+aiosqlite:///books.db')  # Create an async engine for connecting to a SQLite database

new_session = async_sessionmaker(engine, expire_on_commit=False)  # Create an async sessionmaker for managing database

async def get_session():
    async with new_session() as session:
        yield session
     
        
class Base(DeclarativeBase):
    pass