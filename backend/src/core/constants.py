import enum
from pathlib import Path
import re


# region ===================== ENUMS =====================

# Order Status Enum
class OrderStatus(enum.Enum):
    inTransit = "in Transit"
    delivered = "delivered"
    delayed = "delayed"
    

# Role Status Enum
class RoleStatus(enum.Enum):
    user = "user"
    seller = "seller"
    admin = "admin"
    

# Seller Request Status
class SellerRequestStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    
# endregion
    
    
# region ===================== File Upload Constants =====================

# Avatar Upload Size Settings
AVATAR_MAX_SIZE_BYTES = 3 * 1024 * 1024   # 3 MB
AVATAR_CHUNK_SIZE = 1 * 1024 * 1024       # 1 MB

# Avatar Path Config
BASE_DIR = Path(__file__).resolve().parent.parent.parent    # Определяем расположение папки на два уровня вверх от src/core/constants.py
AVATAR_DIR = BASE_DIR / "media" / "avatars"                 # Расположение папки в GrowCore/media/avatars
AVATAR_URL_PREFIX = "/media/avatars"

# Dictionary With Allowed Avatar Image Types
ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

# endregion


# Регулярное выражение для публичного айди
PUBLIC_ID_RE = re.compile(r"^#[0-9A-F]{10}$")   # Разрешает только правильные публичные айди ex: #A1B2C3D4E5