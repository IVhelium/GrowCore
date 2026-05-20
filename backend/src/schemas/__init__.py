from pydantic import BaseModel
from backend.src.schemas.Seller.seller_requests import CreateSellerRequestDTO, ReadSellerRequestDTO
from backend.src.schemas.Seller.stores import CreateStoreDTO, ReadStoreDTO, UpdateStoreDTO, ShortStoreDTO
from backend.src.schemas.Store.carts import ReadCartDTO, CreateCartItemDTO, ReadCartItemDTO, UpdateCartItemDTO
from backend.src.schemas.Store.categories import CreateCategoryDTO, ReadCategoryDTO
from backend.src.schemas.Store.orders import ReadOrderDTO, ReadOrderItemDTO
from backend.src.schemas.Store.products import CreateProductDTO, ReadProductDTO, ShortProductDTO, UpdateProductDTO, ReadProductImageDTO
from backend.src.schemas.Store.reviews import CreateReviewDTO, ReadReviewDTO
from backend.src.schemas.User.roles import ReadRoleDTO
from backend.src.schemas.User.user_roles import ReadUserRoleDTO
from backend.src.schemas.User.users import CreateUserDTO, ReadUserDTO, ShortUserDTO, UpdateUserDTO
from backend.src.schemas.User.auth import RegisterDTO, LoginDTO, TokenResponseDTO


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