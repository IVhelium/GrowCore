from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from src.core.constants import BASE_DIR

class Settings(BaseSettings):
    ENV: str = "development"

    # Database
    DATABASE_URL: str | None = None
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_HOST: str | None = None
    POSTGRES_PORT: int | None = None
    POSTGRES_DB: str | None = None
    DB_POOL_SIZE: int = 2
    DB_MAX_OVERFLOW: int = 3
    
    
    # JWT
    JWT_SECRET: str
    JWT_ACCESS_COOKIE_NAME: str
    JWT_REFRESH_COOKIE_NAME: str
    JWT_COOKIE_SECURE: bool = False
    JWT_COOKIE_SAMESITE: str = "lax"
    
    # File Storage
    FILE_STORAGE_BACKEND: str = "cloudinary"
    STORAGE_ROOT: Path = BASE_DIR / "storage"
    CLOUDINARY_URL: str | None = None
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_FOLDER: str = "growcore"
    
    # Media URL Prefix
    MEDIA_URL_PREFIX: str = "/media"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    ADDITIONAL_CORS_ORIGINS: str | None = None

    # Stripe
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_CURRENCY: str = "eur"
    
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

    @field_validator("FILE_STORAGE_BACKEND", mode="before")
    @classmethod
    def normalize_file_storage_backend(cls, value):
        if value is None or str(value).strip() == "":
            return "cloudinary"

        normalized = str(value).strip().lower()

        if normalized not in {"cloudinary", "local"}:
            raise ValueError("FILE_STORAGE_BACKEND must be 'cloudinary' or 'local'")

        return normalized
    
    
    # Db URL
    @property
    def DATABASE_URL_asyncpg(self):
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                return self.DATABASE_URL
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace(
                    "postgresql://",
                    "postgresql+asyncpg://",
                    1,
                )
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace(
                    "postgres://",
                    "postgresql+asyncpg://",
                    1,
                )

            return self.DATABASE_URL

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @model_validator(mode="after")
    def validate_database_config(self):
        if self.DATABASE_URL:
            return self

        missing = [
            field
            for field in (
                "POSTGRES_USER",
                "POSTGRES_PASSWORD",
                "POSTGRES_HOST",
                "POSTGRES_PORT",
                "POSTGRES_DB",
            )
            if getattr(self, field) in (None, "")
        ]

        if missing:
            raise ValueError(
                "Set DATABASE_URL or all PostgreSQL fields: "
                + ", ".join(missing)
            )

        return self

    @property
    def CORS_ORIGINS(self) -> list[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            self.FRONTEND_URL,
        ]

        if self.ADDITIONAL_CORS_ORIGINS:
            origins.extend(
                origin.strip()
                for origin in self.ADDITIONAL_CORS_ORIGINS.split(",")
                if origin.strip()
            )

        return list(dict.fromkeys(origins))
    
    # File Storage
    @property
    def PUBLIC_STORAGE_DIR(self) -> Path:
        return self.STORAGE_ROOT / "public"
    
    @property
    def PRIVATE_STORAGE_DIR(self) -> Path:
        return self.STORAGE_ROOT / "private"

        
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
