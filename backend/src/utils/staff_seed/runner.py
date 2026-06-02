from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.utils.staff_seed.data import build_staff_seed_users
from src.utils.staff_seed.roles import ensure_all_roles
from src.utils.staff_seed.users import seed_staff_user


async def run_staff_seed(
    async_session_maker,
) -> None:
    """
    Runs the staff seed in a separate database session

    Creates:
    - the user, seller, support, and admin roles
    - an admin user
    - a support user
    - user-role associations
    """

    async with async_session_maker() as db:
        try:
            async with db.begin():
                roles = await ensure_all_roles(db)
                staff_users = build_staff_seed_users()

                for staff_seed in staff_users:
                    await seed_staff_user(
                        db=db,
                        seed=staff_seed,
                        roles=roles,
                    )

        except IntegrityError as exc:
            raise RuntimeError(
                "Staff seed conflict. Check usernames, emails and roles"
            ) from exc

        except SQLAlchemyError as exc:
            raise RuntimeError(
                "Database error while running staff seed"
            ) from exc