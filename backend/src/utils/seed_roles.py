from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel)
from backend.src.core.constants import RoleStatus


async def seed_roles(db: AsyncSession):
    roles = [
        RoleStatus.user,
        RoleStatus.seller,
        RoleStatus.admin
    ]
    
    for role in roles:
        query = (
            select(RoleModel)
            .where(RoleModel.role == role.value)
        )
        
        result = await db.execute(query)
        
        role_exist = result.scalar_one_or_none()
        
        # Create role if not exists
        if not role_exist:
            new_role = RoleModel(role = role.value)
            
            db.add(new_role)
        
    await db.commit()