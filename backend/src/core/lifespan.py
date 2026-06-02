from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.core.config import settings
from src.core.database import new_session
from src.utils.staff_seed import run_staff_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan of the application

    At startup:
    - creates storage/public
    - creates storage/private
    - if RUN_STAFF_SEED=true, runs the staff seed
    """

    settings.PUBLIC_STORAGE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    settings.PRIVATE_STORAGE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    if settings.RUN_STAFF_SEED:
        await run_staff_seed(new_session)

    yield
