from sqlalchemy import select 
from sqlalchemy.ext.asyncio import AsyncSession
from src.models import RoleModel, RoleStatus


async def seed_roles(db: AsyncSession):
    roles = [
        RoleStatus.user,
        RoleStatus.seller,
        RoleStatus.admin
    ]
    
    for role in roles:
        query = (
            select(RoleModel)
            .where(RoleModel.role == role)
        )
        
        result = await db.execute(query)
        
        role_exist = result.scalar_one_or_none()
        
        # Create role if not exists
        if not role_exist:
            new_role = RoleModel(
                role = role
            )
            
            db.add(new_role)
        
    await db.commit()