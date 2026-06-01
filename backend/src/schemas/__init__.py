from pydantic import BaseModel
from .Seller.seller_requests import CreateSellerRequestDTO, ReadSellerRequestDTO, RejectSellerRequestDTO, ResubmitSellerRequestDTO
from .Seller.stores import CreateStoreDTO, ReadStoreDTO, UpdateStoreDTO, ShortStoreDTO
from .Store.carts import ReadCartDTO, CreateCartItemDTO, ReadCartItemDTO, UpdateCartItemDTO
from .Store.categories import CreateCategoryDTO, ReadCategoryDTO
from .Store.orders import ReadOrderDTO, ReadOrderItemDTO
from .Store.products import (
    CreateProductDTO,
    ReadProductDTO,
    ShortProductDTO,
    UpdateProductAvailabilityDTO,
    UpdateProductDTO,
    ReadProductImageDTO,
    ReadProductCategoryDTO,
    ReadProductStoreDTO,
    RejectProductDTO,
)
from .Store.reviews import CreateReviewDTO, ReadReviewDTO
from .User.roles import ReadRoleDTO
from .User.user_roles import ReadUserRoleDTO
from .User.users import CreateUserDTO, ReadUserDTO, ShortUserDTO, UpdateUserDTO
from .User.auth import RegisterDTO, LoginDTO, TokenResponseDTO
from .pagination import PaginationDTO
from .Support.support_tickets import CreateSupportTicketDTO, ReadSupportTicketDTO, UpdateSupportTicketDTO


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
ReadProductCategoryDTO.model_rebuild()
ReadProductStoreDTO.model_rebuild()
ReadReviewDTO.model_rebuild()
ReadRoleDTO.model_rebuild()
ReadUserRoleDTO.model_rebuild()
ReadUserDTO.model_rebuild()
ShortUserDTO.model_rebuild()
ReadSupportTicketDTO.model_rebuild()