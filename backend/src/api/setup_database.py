from fastapi import APIRouter
from src.core.config import settings
from src.core.database import engine, new_session
from src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel)
from src.utils.staff_seed import run_staff_seed

# Config endpoints
router = APIRouter()

# Setup database
@router.post("/setup_database", tags=["Config"])
async def setup_database():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    if settings.RUN_STAFF_SEED:
        await run_staff_seed(new_session)

    return {"success": True, "message": "Database setup completed successfully"}
