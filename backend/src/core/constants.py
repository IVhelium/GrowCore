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
    returned = "returned"


class PaymentStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    refunded = "refunded"
    failed = "failed"


class DeliveryStatus(enum.Enum):
    preparing = "preparing"
    in_transit = "in_transit"
    delivered = "delivered"
    delayed = "delayed"


class ReturnStatus(enum.Enum):
    none = "none"
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    refunded = "refunded"
    

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
    

# Product Moderation Status
class ProductModerationStatus(enum.Enum):
    draft = "draft"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    blocked = "blocked"
    deleted = "deleted"
    
    
# Support Request Status
class SupportTicketStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class SupportTicketType(enum.Enum):
    account = "account"
    order = "order"
    payment = "payment"
    return_request = "return_request"
    seller = "seller"
    technical = "technical"
    other = "other"
    
# endregion
    
    
# File Upload Constants

# Avatar Path Config
BASE_DIR = Path(__file__).resolve().parent.parent.parent      # Specify the folder location two levels above src/core/constants.py
PUBLIC_STORAGE_DIR = BASE_DIR / "public"
PRIVATE_STORAGE_DIR = BASE_DIR / "private"

# Dictionary With Allowed Images Types
ALLOWED_PHOTO_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}
ALLOWED_AVATAR_CONTENT_TYPES = ALLOWED_PHOTO_CONTENT_TYPES

# Dictionary With Allowed Documents Types
ALLOWED_DOCUMENT_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}


# Regular expression for a public ID
PUBLIC_ID_RE = re.compile(r"^#[0-9A-F]{10}$")   # Allows only valid public IDs ex: #A1B2C3D4E5
