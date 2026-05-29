from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from src.core.config import settings
from src.core.constants import ALLOWED_PHOTO_CONTENT_TYPES, ALLOWED_DOCUMENT_CONTENT_TYPES


SignatureValidator = Callable[[bytes], bool]


@dataclass(frozen=True)
class UploadPolicy:
    base_directory: Path
    required_prefix: str
    max_size_bytes: int
    chunk_size_bytes: int
    allowed_content_types: dict[str, str]
    signatures: dict[str, SignatureValidator]
    is_public: bool


   
# Image Type Validation Dictionary
IMAGE_SIGNATURES: dict[str, SignatureValidator] = {    
    "image/jpeg": lambda h: h.startswith(b"\xff\xd8\xff"),
    "image/png":  lambda h: h.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda h: h.startswith(b"RIFF") and h[8:12] == b"WEBP"
}

# Document Type Validation Dictionary
DOCUMENT_SIGNATURES: dict[str, SignatureValidator] = {
    "application/pdf": lambda h: h.startswith(b"%PDF-"),
    "image/jpeg":      lambda h: h.startswith(b"\xff\xd8\xff"),
    "image/png":       lambda h: h.startswith(b"\x89PNG\r\n\x1a\n")
}


# Policy config
AVATAR_POLICY = UploadPolicy(
    base_directory=settings.PUBLIC_STORAGE_DIR,
    required_prefix="avatars",
    max_size_bytes=3 * 1024 * 1024,
    chunk_size_bytes=1024 * 1024,
    allowed_content_types=ALLOWED_PHOTO_CONTENT_TYPES,
    signatures=IMAGE_SIGNATURES,
    is_public=True
)

PRODUCT_IMAGE_POLICY = UploadPolicy(
    base_directory=settings.PUBLIC_STORAGE_DIR,
    required_prefix="products",
    max_size_bytes=8 * 1024 * 1024,
    chunk_size_bytes=1024 * 1024,
    allowed_content_types=ALLOWED_PHOTO_CONTENT_TYPES,
    signatures=IMAGE_SIGNATURES,
    is_public=True
)   
    
SELLER_DOCUMENT_POLICY = UploadPolicy(
    base_directory=settings.PRIVATE_STORAGE_DIR,
    required_prefix="seller-documents",
    max_size_bytes=10 * 1024 * 1024,
    chunk_size_bytes=1024 * 1024,
    allowed_content_types=ALLOWED_DOCUMENT_CONTENT_TYPES,
    signatures=DOCUMENT_SIGNATURES,
    is_public=False
)