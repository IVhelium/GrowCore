from contextlib import asynccontextmanager
import asyncio
import logging

from fastapi import FastAPI

from src.core.config import settings
from src.core.database import new_session
from src.utils.catalog_seed import run_catalog_seed
from src.utils.staff_seed import run_staff_seed
from src.utils.staff_seed.roles import ensure_all_roles


logger = logging.getLogger(__name__)


SEED_TIMEOUT_SECONDS = 30


async def ensure_required_roles() -> None:
    """Ensures the basic user roles exist before the API accepts requests."""
    async with new_session() as db:
        async with db.begin():
            await ensure_all_roles(db)


async def run_with_timeout(name: str, awaitable, timeout: int = SEED_TIMEOUT_SECONDS) -> None:
    """Runs a startup task with a time limit so a failed seed cannot block the API."""
    try:
        await asyncio.wait_for(awaitable, timeout=timeout)
    except TimeoutError:
        logger.error("%s timed out after %s seconds", name, timeout)
    except Exception:
        logger.exception("%s failed", name)


async def run_startup_seeds() -> None:
    """Runs optional staff and catalogue seed data configured through environment variables."""
    if settings.RUN_STAFF_SEED:
        await run_with_timeout(
            "Staff seed",
            run_staff_seed(new_session),
        )

    if settings.RUN_CATALOG_SEED:
        await run_with_timeout(
            "Catalog seed",
            run_catalog_seed(new_session),
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Prepares storage, roles, and optional sample data when the API starts."""

    if settings.FILE_STORAGE_BACKEND == "local":
        settings.PUBLIC_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        settings.PRIVATE_STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

    # Required roles must exist before the API begins accepting requests.
    await asyncio.wait_for(ensure_required_roles(), timeout=10)
    await run_startup_seeds()
    yield
