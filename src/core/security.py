from authx import AuthXConfig, AuthX
from passlib.context import CryptContext
from src.core.config import settings


# ================ JWT ================

# Configure AuthX
auth_config = AuthXConfig(
    # JWT
    JWT_SECRET_KEY=settings.JWT_SECRET,
    
    # JWT_COOKIE
    JWT_TOKEN_LOCATION = ["cookies"],
    JWT_ACCESS_COOKIE_NAME = settings.JWT_ACCESS_COOKIE_NAME,
    JWT_COOKIE_CSRF_PROTECT = False,
    JWT_COOKIE_SECURE = False,
    JWT_COOKIE_SAMESITE = "lax",
    
    # EXPIRE
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60
)

# Initialize AuthX
auth = AuthX(config=auth_config)



# ================ Password Hash ================

pwb_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Hash Password
def hash_password(password: str) -> str:
    return pwb_context.hash(password)


# Verify Password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwb_context.verify(plain_password, hashed_password)