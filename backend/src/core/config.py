from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from src.core.constants import BASE_DIR

class Settings(BaseSettings):
    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    
    # JWT
    JWT_SECRET: str
    JWT_ACCESS_COOKIE_NAME: str
    JWT_REFRESH_COOKIE_NAME: str
    
    # File Storage
    STORAGE_ROOT: Path = BASE_DIR / "storage"
    
    # Media URL Prefix
    MEDIA_URL_PREFIX: str = "/media"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Seed
    RUN_STAFF_SEED: bool = False
    RUN_CATALOG_SEED: bool = True

    SEED_ADMIN_USERNAME: str | None = None
    SEED_ADMIN_EMAIL: str | None = None
    SEED_ADMIN_PASSWORD: str | None = None

    SEED_SUPPORT_USERNAME: str | None = None
    SEED_SUPPORT_EMAIL: str | None = None
    SEED_SUPPORT_PASSWORD: str | None = None

    UPDATE_SEEDED_USERS_PASSWORDS: bool = False
    
    
    # Db URL
    @property
    def DATABASE_URL_asyncpg(self):
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # File Storage
    @property
    def PUBLIC_STORAGE_DIR(self) -> Path:
        return self.STORAGE_ROOT / "public"
    
    @property
    def PRIVATE_STORAGE_DIR(self) -> Path:
        return self.STORAGE_ROOT / "private"

        
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
