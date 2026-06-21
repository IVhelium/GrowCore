from datetime import timedelta

from authx import AuthXConfig, AuthX
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from src.core.config import settings


# ================ JWT ================

# Configure AuthX
auth_config = AuthXConfig(
    # JWT
    JWT_SECRET_KEY=settings.JWT_SECRET,
    
    # JWT_COOKIE
    JWT_TOKEN_LOCATION = ["cookies"],
    JWT_ACCESS_COOKIE_NAME = settings.JWT_ACCESS_COOKIE_NAME,
    JWT_REFRESH_COOKIE_NAME= settings.JWT_REFRESH_COOKIE_NAME,
    
    # JWT_COOKIE CONFIG
    JWT_COOKIE_CSRF_PROTECT = settings.JWT_COOKIE_CSRF_PROTECT,
    JWT_COOKIE_SECURE = settings.JWT_COOKIE_SECURE,
    JWT_COOKIE_SAMESITE = settings.JWT_COOKIE_SAMESITE,
    
    # EXPIRE
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1),
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=80)
)

# Initialize AuthX
auth = AuthX(config=auth_config)



# ================ Password Hash ================

pwd_context = PasswordHash(hashers=[BcryptHasher(rounds=12, prefix="2b")])
# Hash Password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Verify Password
def verify_password(
    plain_password: str, 
    hashed_password: str
) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
