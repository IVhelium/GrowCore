import enum

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