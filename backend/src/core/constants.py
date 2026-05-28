import enum
from pathlib import Path
import re

# CORS
ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]


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
    support="support"
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
BASE_DIR = Path(__file__).resolve().parent.parent.parent    # Specify the folder location two levels above src/core/constants.py
AVATAR_DIR = BASE_DIR / "storage" / "avatars"                 # The folder is located in GrowCore/storage/avatars
AVATAR_URL_PREFIX = "/storage/avatars"

# Dictionary With Allowed Avatar Image Types
ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

# endregion


# Regular expression for a public ID
PUBLIC_ID_RE = re.compile(r"^#[0-9A-F]{10}$")   # Allows only valid public IDs ex: #A1B2C3D4E5