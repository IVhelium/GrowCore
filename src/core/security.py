from authx import AuthXConfig, AuthX
from src.core.config import settings

# Configure AuthX
auth_config = AuthXConfig(
    JWT_SECRET_KEY=settings.JWT_SECRET,
    JWT_ACCESS_COOKIE_NAME=settings.JWT_ACCESS_COOKIE_NAME,
    JWT_TOKEN_LOCATION=["cookes"],
    JWT_COOKIE_CSRF_PROTECT=False,
    JWT_COOKIE_SECURE=False
)

# Initialize AuthX
auth = AuthX(config=auth_config)