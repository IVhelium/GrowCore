from fastapi import APIRouter
from src.api.routers.user import router as user_router
from src.api.routers.auth import router as auth_router
from src.api.routers.product import router as product_router
from src.api.setup_database import router as config_router

main_router = APIRouter()

main_router.include_router(auth_router)
main_router.include_router(user_router)
main_router.include_router(product_router)
main_router.include_router(config_router)
