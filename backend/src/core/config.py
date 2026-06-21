from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from src.core.constants import BASE_DIR

class Settings(BaseSettings):
    ENV: str = "development"

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 2
    DB_MAX_OVERFLOW: int = 3
    
    
    # JWT
    JWT_SECRET: str
    JWT_ACCESS_COOKIE_NAME: str
    JWT_REFRESH_COOKIE_NAME: str
    JWT_COOKIE_SECURE: bool = False
    JWT_COOKIE_SAMESITE: str = "lax"
    JWT_COOKIE_CSRF_PROTECT: bool = True
    
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
    STRIPE_AUTOMATIC_TAX: bool = False
    STRIPE_SHIPPING_ALLOWED_COUNTRIES: str | None = None
    
    # Seed
    RUN_STAFF_SEED: bool = False
    RUN_CATALOG_SEED: bool = False

    SEED_ADMIN_USERNAME: str | None = None
    SEED_ADMIN_EMAIL: str | None = None
    SEED_ADMIN_PASSWORD: str | None = None

    SEED_SUPPORT_USERNAME: str | None = None
    SEED_SUPPORT_EMAIL: str | None = None
    SEED_SUPPORT_PASSWORD: str | None = None

    UPDATE_SEEDED_USERS_PASSWORDS: bool = False
    CATEGORY_MANAGEMENT_SECRET: str | None = None

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.ENV.strip().lower() != "production":
            return self

        if len(self.JWT_SECRET.strip()) < 32 or self.JWT_SECRET.startswith("<"):
            raise ValueError("JWT_SECRET must contain at least 32 non-placeholder characters in production")
        if not self.JWT_COOKIE_SECURE:
            raise ValueError("JWT_COOKIE_SECURE must be true in production")
        if not self.JWT_COOKIE_CSRF_PROTECT:
            raise ValueError("JWT_COOKIE_CSRF_PROTECT must be true in production")
        if self.RUN_CATALOG_SEED:
            raise ValueError("RUN_CATALOG_SEED must be false in production")

        category_secret = (self.CATEGORY_MANAGEMENT_SECRET or "").strip()
        if len(category_secret) < 32 or category_secret.startswith("<"):
            raise ValueError("CATEGORY_MANAGEMENT_SECRET must contain at least 32 non-placeholder characters")

        if self.STRIPE_SECRET_KEY and not self.STRIPE_WEBHOOK_SECRET:
            raise ValueError("STRIPE_WEBHOOK_SECRET is required when Stripe payments are enabled")

        if self.FILE_STORAGE_BACKEND == "cloudinary":
            cloudinary_values = (
                self.CLOUDINARY_CLOUD_NAME,
                self.CLOUDINARY_API_KEY,
                self.CLOUDINARY_API_SECRET,
            )
            has_cloudinary_url = bool(
                self.CLOUDINARY_URL and not self.CLOUDINARY_URL.startswith("<")
            )
            has_cloudinary_fields = all(
                value and not value.startswith("<")
                for value in cloudinary_values
            )
            if not has_cloudinary_url and not has_cloudinary_fields:
                raise ValueError("Cloudinary credentials are required for cloudinary storage")

        if self.RUN_STAFF_SEED:
            for name, password in (
                ("SEED_ADMIN_PASSWORD", self.SEED_ADMIN_PASSWORD),
                ("SEED_SUPPORT_PASSWORD", self.SEED_SUPPORT_PASSWORD),
            ):
                if not password or len(password) < 12 or password.startswith("<"):
                    raise ValueError(f"{name} must contain at least 12 non-placeholder characters")

        return self

    @field_validator("FILE_STORAGE_BACKEND", mode="before")
    @classmethod
    def normalize_file_storage_backend(cls, value):
        if value is None or str(value).strip() == "":
            return "cloudinary"

        normalized = str(value).strip().lower()

        if normalized not in {"cloudinary", "local"}:
            raise ValueError("FILE_STORAGE_BACKEND must be 'cloudinary' or 'local'")

        return normalized

    @field_validator("STRIPE_CURRENCY", mode="before")
    @classmethod
    def normalize_stripe_currency(cls, value):
        value = str(value or "eur").strip().lower()

        if len(value) != 3:
            raise ValueError("STRIPE_CURRENCY must be a 3-letter currency code")

        return value

    @property
    def STRIPE_SHIPPING_COUNTRY_LIST(self) -> list[str] | None:
        if not self.STRIPE_SHIPPING_ALLOWED_COUNTRIES:
            return None

        countries = [
            country.strip().upper()
            for country in self.STRIPE_SHIPPING_ALLOWED_COUNTRIES.split(",")
            if country.strip()
        ]

        return countries or None

    # Db URL
    @property
    def DATABASE_URL_asyncpg(self):
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
