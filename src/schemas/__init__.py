from pydantic import BaseModel
from src.schemas.Seller.seller_requests import CreateSellerRequestDTO, ReadSellerRequestDTO
from src.schemas.Seller.stores import CreateStoreDTO, ReadStoreDTO
from src.schemas.Store.carts import ReadCartDTO, CreateCartItemDTO, ReadCartItemDTO
from src.schemas.Store.categories import CreateCategoryDTO, ReadCategoryDTO
from src.schemas.Store.orders import ReadOrderDTO, ReadOrderItemDTO, OrderStatus
from src.schemas.Store.products import CreateProductDTO, ReadProductDTO, CreateProductImageDTO, ReadProductImageDTO
from src.schemas.Store.reviews import CreateReviewDTO, ReadReviewDTO
from src.schemas.User.roles import ReadRoleDTO, RoleStatus
from src.schemas.User.user_roles import ReadUserRoleDTO
from src.schemas.User.users import CreateUserDTO, ReadUserDTO