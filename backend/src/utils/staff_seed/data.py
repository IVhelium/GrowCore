from dataclasses import dataclass

from src.core.config import settings
from src.core.constants import RoleStatus


@dataclass(frozen=True)
class StaffUserSeed:
    """
    Staff user data for seed
    Used to create admin and support accounts
    """

    username: str
    email: str
    password: str
    roles: tuple[RoleStatus, ...]


def require_seed_value(
    value: str | None,
    field_name: str,
) -> str:
    """
    Checks the required seed value from Pydantic settings
    If RUN_STAFF_SEED=true, the admin/support values must be specified
    """

    if value is None or not value.strip():
        raise RuntimeError(f"Missing seed setting: {field_name}")

    return value.strip()


def build_staff_seed_users() -> list[StaffUserSeed]:
    """
    Retrieves seed data for admin and support users from the settings
    """

    admin_seed = StaffUserSeed(
        username=require_seed_value(
            settings.SEED_ADMIN_USERNAME,
            "SEED_ADMIN_USERNAME",
        ),
        email=require_seed_value(
            settings.SEED_ADMIN_EMAIL,
            "SEED_ADMIN_EMAIL",
        ).lower(),
        password=require_seed_value(
            settings.SEED_ADMIN_PASSWORD,
            "SEED_ADMIN_PASSWORD",
        ),
        roles=(
            RoleStatus.user,
            RoleStatus.support,
            RoleStatus.admin,
        ),
    )

    support_seed = StaffUserSeed(
        username=require_seed_value(
            settings.SEED_SUPPORT_USERNAME,
            "SEED_SUPPORT_USERNAME",
        ),
        email=require_seed_value(
            settings.SEED_SUPPORT_EMAIL,
            "SEED_SUPPORT_EMAIL",
        ).lower(),
        password=require_seed_value(
            settings.SEED_SUPPORT_PASSWORD,
            "SEED_SUPPORT_PASSWORD",
        ),
        roles=(
            RoleStatus.user,
            RoleStatus.support,
        ),
    )

    return [
        admin_seed,
        support_seed,
    ]