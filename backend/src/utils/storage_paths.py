from src.models import UserModel


def stable_public_id_segment(public_id: str) -> str:
    """Converts a public ID into a stable, safe folder-name segment."""
    
    return public_id.lstrip("#").upper()


def avatar_directory_key(user: UserModel) -> str:
    """Builds the storage folder key used for one user's avatar files."""
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"avatars/{public_id}"


def seller_products_directory_key(user: UserModel) -> str:
    """Builds the storage folder key used for all products of one seller."""
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"products/{public_id}"


def product_images_directory_key(
    seller_directory_key: str,
    product_id: int
) -> str:
    """Builds the image folder key for one specific seller product."""
    
    return f"{seller_directory_key}/product_{product_id}/images"


def seller_request_documents_directory_key(
    user: UserModel,
    request_id: int
) -> str:
    """Builds the private folder key for documents in a seller application."""
    
    public_id = stable_public_id_segment(user.public_id)
    
    return f"seller-documents/{public_id}/request_{request_id}"
