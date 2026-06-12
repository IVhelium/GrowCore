from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants import RoleStatus
from src.models import RoleModel


async def get_role(
    db: AsyncSession,
    role: RoleStatus,
) -> RoleModel | None:
    """
    Searches for a role by RoleStatus
    """

    result = await db.execute(
        select(RoleModel)
        .where(RoleModel.role == role)
    )

    return result.scalar_one_or_none()


async def ensure_role(
    db: AsyncSession,
    role: RoleStatus,
) -> RoleModel:
    """
    Creates a role if it does not already exist
    Rerunning the seed does not create a duplicate role
    """

    existing_role = await get_role(
        db=db,
        role=role,
    )

    if existing_role:
        return existing_role

    new_role = RoleModel(role=role)

    db.add(new_role)

    await db.flush()

    return new_role


async def ensure_all_roles(
    db: AsyncSession,
) -> dict[RoleStatus, RoleModel]:
    """
    Creates all the basic application roles
    Uses roles from the RoleStatus enum:
    user, seller, support, admin
    """

    roles: dict[RoleStatus, RoleModel] = {}

    for role in RoleStatus:
        roles[role] = await ensure_role(
            db=db,
            role=role,
        )

    return roles