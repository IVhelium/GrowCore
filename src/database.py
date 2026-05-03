from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.config import settings


# ======= Создание движка и сессий для работы с бд ======= #

engine = create_async_engine(               # Create an async engine for connecting to a PostgreSQL database
    url=settings.DATABASE_URL_asyncpg,      # Ссылка на подключение
    echo=True,                              # Будет показывать в концоли все SQL запросы
    pool_size=5,                            # Стандартное максимальное количество подключений к базе
    max_overflow=10,                        # Максимально допустимое количество подключений к базе
    pool_pre_ping=True,                     # Проверка работоспособности перед использованием
)  

new_session = async_sessionmaker(           # Create an async sessionmaker for managing database
    engine, 
    expire_on_commit=False
)  

async def get_session():
    async with new_session() as session:
        yield session
         
class Base(DeclarativeBase):
    pass