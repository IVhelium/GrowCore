from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.constants import RoleStatus
from src.core.security import hash_password
from src.models import RoleModel, UserModel, UserRoleModel
from src.utils.staff_seed.data import StaffUserSeed


async def get_user_by_email(
    db: AsyncSession,
    email: str,
) -> UserModel | None:
    """
    Search for a user by email
    """

    result = await db.execute(
        select(UserModel)
        .where(UserModel.email == email)
    )

    return result.scalar_one_or_none()


async def get_user_by_username(
    db: AsyncSession,
    username: str,
) -> UserModel | None:
    """
    Searches for a user by username
    """

    result = await db.execute(
        select(UserModel)
        .where(UserModel.username == username)
    )

    return result.scalar_one_or_none()


async def ensure_staff_user(
    db: AsyncSession,
    seed: StaffUserSeed,
) -> UserModel:
    """
    Creates a staff user if one does not already exist

    The user is searched for by email
    If the user already exists and `UPDATE_SEEDED_USERS_PASSWORDS=true`,
    their password is updated
    """

    username = seed.username.strip()
    email = seed.email.strip().lower()
    password = seed.password

    if not username:
        raise RuntimeError("Seed username cannot be empty")

    if not email:
        raise RuntimeError("Seed email cannot be empty")

    if not password:
        raise RuntimeError("Seed password cannot be empty")

    existing_by_email = await get_user_by_email(
        db=db,
        email=email,
    )

    if existing_by_email:
        if existing_by_email.username != username:
            raise RuntimeError(
                f"User with email '{email}' already exists, "
                f"but username is '{existing_by_email.username}', "
                f"expected '{username}'"
            )

        if settings.UPDATE_SEEDED_USERS_PASSWORDS:
            existing_by_email.password_hash = hash_password(password)

        return existing_by_email

    existing_by_username = await get_user_by_username(
        db=db,
        username=username,
    )

    if existing_by_username:
        raise RuntimeError(
            f"Username '{username}' already exists with another email"
        )

    user = UserModel(
        username=username,
        email=email,
        password_hash=hash_password(password),
    )

    db.add(user)

    await db.flush()

    return user


async def user_has_role(
    db: AsyncSession,
    user: UserModel,
    role: RoleModel,
) -> bool:
    """
    Checks whether a user-role relationship already exists
    """

    result = await db.execute(
        select(UserRoleModel)
        .where(
            UserRoleModel.user_id == user.id,
            UserRoleModel.role_id == role.id,
        )
    )

    existing_relation = result.scalar_one_or_none()

    return existing_relation is not None


async def ensure_user_role(
    db: AsyncSession,
    user: UserModel,
    role: RoleModel,
) -> None:
    """
    Assigns a role to the user if it has not yet been assigned
    """

    if await user_has_role(db=db, user=user, role=role):
        return

    db.add(
        UserRoleModel(
            user_id=user.id,
            role_id=role.id,
        )
    )


async def seed_staff_user(
    db: AsyncSession,
    seed: StaffUserSeed,
    roles: dict[RoleStatus, RoleModel],
) -> None:
    """
    Creates a single staff user and assigns roles to them
    """

    user = await ensure_staff_user(
        db=db,
        seed=seed,
    )

    for role_status in seed.roles:
        await ensure_user_role(
            db=db,
            user=user,
            role=roles[role_status],
        )