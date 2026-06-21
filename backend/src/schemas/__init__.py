from pydantic import BaseModel
from .Seller.seller_requests import CreateSellerRequestDTO, ReadSellerRequestDTO, RejectSellerRequestDTO, ResubmitSellerRequestDTO
from .Seller.stores import CreateStoreDTO, ReadStoreDTO, UpdateStoreDTO, ShortStoreDTO, UpdateStoreFilterDTO
from .Store.carts import ReadCartDTO, AddCartItemDTO, ReadCartItemDTO, UpdateCartItemDTO, ReadCartProductDTO, ReadCartProductImageDTO
from .Store.categories import CreateCategoryDTO, ReadCategoryDTO, UpdateCategoryDTO
from .Store.orders import CheckoutDTO, CreateStripeCheckoutDTO, ReadOrderDTO, ReadOrderItemDTO, ReadOrderProductDTO, ReadOrderProductImageDTO, RequestReturnDTO, UpdateDeliveryDTO
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
    DeleteProductDTO,
)
from .Store.favorites import (
    AddFavoriteDTO,
    MoveFavoriteToCartDTO,
    ReadFavoriteItemDTO,
    ReadFavoriteProductDTO,
    ReadFavoriteProductImageDTO,
)
from .Store.reviews import CreateReviewDTO, CreateReviewReplyDTO, ReadReviewDTO
from .User.roles import ReadRoleDTO
from .User.user_roles import ReadUserRoleDTO
from .User.users import (
    CreateUserChatMessageDTO,
    CreateFriendRequestDTO,
    FriendshipStatusDTO,
    PublicUserDTO,
    ReadUserChatMessageDTO,
    CreateUserDTO,
    ReadUserDTO,
    ShortUserDTO,
    UpdateUserDTO,
    UserChatThreadDTO,
    UserFriendRequestDTO,
    BlockUserDTO
)
from .User.notifications import ReadNotificationDTO
from .User.auth import RegisterDTO, LoginDTO, TokenResponseDTO
from .pagination import PaginationDTO
from .Support.support_tickets import CreateSupportTicketDTO, ReadSupportTicketDTO, UpdateSupportTicketDTO


ReadSellerRequestDTO.model_rebuild()
ShortStoreDTO.model_rebuild()
ReadStoreDTO.model_rebuild()
ReadCartDTO.model_rebuild()
ReadCartItemDTO.model_rebuild()
ReadCartProductDTO.model_rebuild()
ReadCartProductImageDTO.model_rebuild()
ReadCategoryDTO.model_rebuild()
ReadOrderDTO.model_rebuild()
ReadOrderItemDTO.model_rebuild()
ReadOrderProductDTO.model_rebuild()
ReadOrderProductImageDTO.model_rebuild()
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
PublicUserDTO.model_rebuild()
CreateUserChatMessageDTO.model_rebuild()
CreateFriendRequestDTO.model_rebuild()
ReadUserChatMessageDTO.model_rebuild()
UserChatThreadDTO.model_rebuild()
FriendshipStatusDTO.model_rebuild()
UserFriendRequestDTO.model_rebuild()
ReadNotificationDTO.model_rebuild()
ReadSupportTicketDTO.model_rebuild()
ReadFavoriteItemDTO.model_rebuild()
ReadFavoriteProductDTO.model_rebuild()
ReadFavoriteProductImageDTO.model_rebuild()
