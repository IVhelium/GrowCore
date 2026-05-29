from faker import Faker
from fastapi import APIRouter
from sqlalchemy import insert, select
from src.core.dependencies import SessionDependency
from src.core.database import engine
from src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel)
from src.core.constants import RoleStatus, OrderStatus

# Config endpoints
router = APIRouter()

fake = Faker()

# Setup database
@router.post("/setup_database", tags=["Config"])
async def setup_database():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    
    return {"success": True, "message": "Database setup completed successfully"}