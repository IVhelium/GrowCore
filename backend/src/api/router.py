from fastapi import APIRouter

from src.api.routers.auth import router as auth_router
from src.api.routers.cart import router as cart_router
from src.api.routers.category import router as category_router
from src.api.routers.chat_ws import router as chat_ws_router
from src.api.routers.favorite import router as favorite_router
from src.api.routers.order import router as order_router
from src.api.routers.product import router as product_router
from src.api.routers.seller_requests.seller_request import router as seller_request_router
from src.api.routers.seller_requests.seller_request_admin import router as seller_request_admin_router
from src.api.routers.store import router as store_router
from src.api.routers.support_ticket import router as support_ticket_router
from src.api.routers.user import router as user_router
from src.api.setup_database import router as config_router


main_router = APIRouter()

main_router.include_router(auth_router)
main_router.include_router(chat_ws_router)
main_router.include_router(user_router)
main_router.include_router(category_router)
main_router.include_router(product_router)
main_router.include_router(config_router)
main_router.include_router(store_router)
main_router.include_router(seller_request_router)
main_router.include_router(seller_request_admin_router)
main_router.include_router(support_ticket_router)
main_router.include_router(cart_router)
main_router.include_router(favorite_router)
main_router.include_router(order_router)
