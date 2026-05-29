import uuid
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
import aiofiles
from fastapi import HTTPException, UploadFile, status

from src.api.services.file_validator import FileValidator
from src.core.config import settings
from src.core.upload_policies import UploadPolicy


@dataclass
class StoredFile:
    storage_key: str
    filesystem_path: Path
    public_url: str | None
    content_type: str
    size_bytes: int
    
    
class FileStorageService:
    """
    General file storage service

    Responsible for:
    - validating storage paths
    - creating directories
    - generating a secure file name
    - saving the file to disk
    - generating public URLs
    - securely deleting the file
    """
    
    def __init__(
        self,
        validator: FileValidator | None = None
    ) -> None:
        self.validator = validator or FileValidator()
    
    
    async def save_file(
        self,
        file: UploadFile,
        policy: UploadPolicy,
        directory_key: str,
    ) -> StoredFile:
        """Saves the file according to the specified policy"""
        
        filesystem_path: Path | None = None
        
        try:
            validated_upload = await self.validator.validate(
                file=file,
                policy=policy
            )
                
            validated_directory_key = self._validate_directory_key(
                directory_key=directory_key,
                policy=policy
            )
            
            filename = f"{uuid.uuid4.hex}{validated_upload.extension}"
            
            storage_key = (
                PurePosixPath(validated_directory_key) / filename
            ).as_posix()
            
            filesystem_path = self._resolve_storage_key(
                storage_key=storage_key,
                policy=policy,
            )
            
            filesystem_path.parent.mkdir(parents=True, exist_ok=True)
            
            total_size = 0
            
            await  file.seek(0)
            
            async with aiofiles.open(filesystem_path, "wb") as output_file:
                while chunk := await file.read(policy.chunk_size_bytes):
                    total_size += len(chunk)
                    
                    if total_size > policy.max_size_bytes:          # Checks the file size; if it exceeds the maximum, it stops writing
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"File too large. Max size: {policy.max_size_bytes}"
                        )
                    
                    await output_file.write(chunk)
            
            if total_size == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File is empty"
                )
                
            public_url: str | None = None
            
            if policy.is_public:
                media_prefix = settings.MEDIA_URL_PREFIX.rstrip("/")
                public_url = f"{media_prefix}/{storage_key}"
                
            return StoredFile(
                storage_key=storage_key,
                filesystem_path=filesystem_path,
                public_url=public_url,
                content_type=validated_upload.content_type,
                size_bytes=total_size
            )
                    
                
        except HTTPException:
            if filesystem_path is not None:
                filesystem_path.unlink(missing_ok=True)
                
            raise 
            
        except Exception:
            if filesystem_path is not None:
                filesystem_path.unlink(missing_ok=True)
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occurred while saving the file",
            ) from exec
            
        finally:
            await file.close()
            
            
    def delete_by_public_url(
        self,
        public_url: str | None,
        policy: UploadPolicy
    ) -> None:
        """Deletes a public file by URL from the database"""
        
        if not public_url:
            return
        
        media_prefix = f"{settings.MEDIA_URL_PREFIX.rstrip('/')}/"
        
        if not public_url.startswith(media_prefix):
            return
        
        storage_key = public_url.removeprefix(media_prefix)
        
        self.delete_by_storage_key(
            storage_key=storage_key,
            policy=policy
        )
        
        
    def delete_by_storage_key(
        self,
        storage_key: str | None,
        policy: UploadPolicy,
    ) -> None:
        """Deletes a file by its internal storage key"""
        
        if not storage_key:
            return
        
        filesystem_path = self._resolve_storage_key(
            storage_key=storage_key,
            policy=policy
        )
        
        filesystem_path.unlink(missing_ok=True)
            
    
    # Method for validate directory key    
    def _validate_directory_key(
        self,
        directory_key: str,
        policy: UploadPolicy,
    ) -> str:
        """Validates an upload directory key before generating a file path"""
        
        if "\\" in directory_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid upload directory",
            )
            
        relative_path = PurePosixPath(directory_key)
        
        if relative_path.is_absolute():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Absolute upload paths are not allowed",
            )
            
        if ".." in relative_path.parts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid upload path",
            )
            
        if not relative_path.parts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload directory is required",
            )
            
        if relative_path.parts[0] != policy.required_prefix:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload directory does not match its policy",
            )
            
        return relative_path.as_posix()
    
    
    def _resolve_storage_key(
        self,
        storage_key: str,
        policy: UploadPolicy,
    ) -> Path:
        
        if "\\" in storage_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage key",
            )
            
        relative_path = PurePosixPath(storage_key)
        
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage key",
            )
            
        if not relative_path.parts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Storage key is empty",
            )    
        
        if relative_path.parts[0] != policy.required_prefix:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Storage key does not match its policy",
            )
            
        base_directory = policy.base_directory.resolve()
        
        filesystem_path = (
            base_directory
            .joinpath(*relative_path.parts)
            .resolve()
        )
        
        if base_directory not in filesystem_path.parents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid resolved storage path",
            )
            
        return filesystem_path