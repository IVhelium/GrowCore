from pydantic import BaseModel
from src.schemas.Seller.seller_requests import CreateSellerRequestDTO, ReadSellerRequestDTO
from src.schemas.Seller.stores import CreateStoreDTO, ReadStoreDTO, UpdateStoreDTO, ShortStoreDTO
from src.schemas.Store.carts import ReadCartDTO, CreateCartItemDTO, ReadCartItemDTO, UpdateCartItemDTO
from src.schemas.Store.categories import CreateCategoryDTO, ReadCategoryDTO
from src.schemas.Store.orders import ReadOrderDTO, ReadOrderItemDTO
from src.schemas.Store.products import CreateProductDTO, ReadProductDTO, ShortProductDTO, UpdateProductDTO, ReadProductImageDTO
from src.schemas.Store.reviews import CreateReviewDTO, ReadReviewDTO
from src.schemas.User.roles import ReadRoleDTO
from src.schemas.User.user_roles import ReadUserRoleDTO
from src.schemas.User.users import CreateUserDTO, ReadUserDTO, ShortUserDTO
from src.schemas.User.auth import RegisterDTO, LoginDTO, TokenResponseDTO


ReadSellerRequestDTO.model_rebuild()
ShortStoreDTO.model_rebuild()
ReadStoreDTO.model_rebuild()
ReadCartDTO.model_rebuild()
ReadCartItemDTO.model_rebuild()
ReadCategoryDTO.model_rebuild()
ReadOrderDTO.model_rebuild()
ReadOrderItemDTO.model_rebuild()
ReadProductDTO.model_rebuild()
ShortProductDTO.model_rebuild()
ReadProductImageDTO.model_rebuild()
ReadReviewDTO.model_rebuild()
ReadRoleDTO.model_rebuild()
ReadUserRoleDTO.model_rebuild()
ReadUserDTO.model_rebuild()
ShortUserDTO.model_rebuild()