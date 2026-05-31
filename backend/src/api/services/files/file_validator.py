from dataclasses import dataclass
from fastapi import HTTPException, UploadFile, status

from src.core.upload_policies import UploadPolicy


@dataclass(frozen=True, slots=True)
class ValidatedUpload:
    """Result of successful file validation"""
    
    content_type: str
    extension: str
    

class FileValidator:
    """
    Responsible only for validating uploaded file content: 
    - normalizing MIME type
    - cheking allowed MIME types
    - checking file signature
    """
    
    @staticmethod
    def normalize_content_type(content_type: str | None) -> str:
        if content_type == "image/jpg":
            return "image/jpeg"
        return content_type or ""
    
    
    async def validate(
        self,
        file: UploadFile,
        policy: UploadPolicy
    ) -> ValidatedUpload:
        """
        Validates uploaded file metadata and binary signature
        Returns validated content type and file extension 
        """
        
        content_type = self.normalize_content_type(file.content_type)
        extension = policy.allowed_content_types.get(content_type)
            
        if extension is None:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    "Unsupported media type"
                    f"Allowed: {list(policy.allowed_content_types.keys())}"
                ),
            )
            
        validator = policy.signatures.get(content_type)
        
        if validator is None:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Signature validation is not configured for this file type",
            )
            
        header = await file.read(12)
        await file.seek(0)
        
        if not validator(header):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Invalid file signature",
            )
            
        return ValidatedUpload(
            content_type=content_type,
            extension=extension
        )