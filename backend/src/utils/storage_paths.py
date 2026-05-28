from src.models import UserModel


def stable_public_id_segment(public_id: str) -> str:
    """ Ex: #A1B2C3D4E5 -> A1B2C3D4E5 """
    
    return public_id.lstrip("#").upper()


def avatar_directory_key(user: UserModel) -> str:
    """ Ex: avatars/A1B2C3D4E5 """
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"avatars/{public_id}"


def seller_products_directory_key(user: UserModel) -> str:
    """ Ex: products/A1B2C3D4E5 """
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"products/{public_id}"


def product_images_directory_key(
    seller_directory_key: str,
    product_id: int
) -> str:
    """ Ex: products/A1B2C3D4E5/prodct_1/images """
    
    return f"{seller_directory_key}/product_{product_id}/images"


def seller_request_documents_directory_key(
    user: UserModel,
    request_id: int
) -> str:
    """ Ex: seller-documents/A1B2C3D4E5/request_2 """
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"seller-documents/{public_id}/request_{request_id}"