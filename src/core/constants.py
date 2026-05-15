import enum
from pathlib import Path


# region ===================== ENUMS =====================

# Order Status Enum
class OrderStatus(enum.Enum):
    inTransit = "In Transit"
    delivered = "Delivered"
    delayed = "Delayed"
    

# Role Status Enum
class RoleStatus(enum.Enum):
    user = "User"
    seller = "Seller"
    admin = "Admin"
    

# Seller Request Status
class SellerRequestStatus(enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"
    
# endregion
    
    
# region ===================== File Upload Constants =====================

# Avatar Upload Size Settings
AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB
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