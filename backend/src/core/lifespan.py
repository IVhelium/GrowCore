from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from src.core.config import settings
from src.core.database import new_session
from src.utils.catalog_seed import run_catalog_seed
from src.utils.staff_seed import run_staff_seed
from src.utils.staff_seed.roles import ensure_all_roles


logger = logging.getLogger(__name__)


async def ensure_required_roles() -> None:
    async with new_session() as db:
        async with db.begin():
            await ensure_all_roles(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan of the application

    At startup:
    - creates storage/public
    - creates storage/private
    - if RUN_STAFF_SEED=true, runs the staff seed
    """

    if settings.FILE_STORAGE_BACKEND == "local":
        settings.PUBLIC_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        settings.PRIVATE_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

    await ensure_required_roles()

    if settings.RUN_STAFF_SEED:
        try:
            await run_staff_seed(new_session)
        except RuntimeError:
            logger.exception("Staff seed failed")

    if settings.RUN_CATALOG_SEED:
        try:
            await run_catalog_seed(new_session)
        except RuntimeError:
            logger.exception("Catalog seed failed")

    yield
