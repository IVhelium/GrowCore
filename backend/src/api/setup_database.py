from fastapi import APIRouter
from src.core.database import engine
from src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel)

# Config endpoints
router = APIRouter()

# Setup database
@router.post("/setup_database", tags=["Config"])
async def setup_database():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    
    return {"success": True, "message": "Database setup completed successfully"}