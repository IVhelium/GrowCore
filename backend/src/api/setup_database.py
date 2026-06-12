from fastapi import APIRouter
from src.core.config import settings
from src.core.database import new_session
from src.utils.catalog_seed import run_catalog_seed
from src.utils.staff_seed import run_staff_seed

# Config endpoints
router = APIRouter()

# Setup database
@router.post("/setup_database", tags=["Config"])
async def setup_database():
    if settings.RUN_STAFF_SEED:
        await run_staff_seed(new_session)

    await run_catalog_seed(new_session)

    return {"success": True, "message": "Database setup completed successfully"}
