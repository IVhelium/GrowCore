from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel)
from src.core.constants import RoleStatus


async def seed_roles(db: AsyncSession):
    for role in RoleStatus:
        result = await db.execute(
            select(RoleModel).where(RoleModel.role == role)
        )

        existing_role = result.scalar_one_or_none()

        if existing_role is None:
            db.add(RoleModel(role=role))

    await db.commit()