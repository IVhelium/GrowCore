import aiofiles
import uuid
from fastapi import UploadFile, HTTPException, status
from src.core.constants import (
    ALLOWED_AVATAR_CONTENT_TYPES,
    AVATAR_MAX_SIZE_BYTES,
    AVATAR_CHUNK_SIZE,
    AVATAR_DIR
)


class AvatarService:
    def __init__(self):
        self.upload_dir = AVATAR_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)  # Checking if a folder exists
        
    
    @staticmethod
    def normalize_content_type(content_type: str | None) -> str:
        if content_type == "image/jpg":
            return "image/jpeg"
        return content_type or ""
    
    
    # Save Avatar method
    async def save_avatar(
        self,
        file: UploadFile
    ) -> str:
        """Saves the avatar to disk and generates a unique filename. Returns only the filename of the saved file"""
        
        normalized_content_type = self.normalize_content_type(file.content_type)
        
        file_type = ALLOWED_AVATAR_CONTENT_TYPES[normalized_content_type]
        unique_filename = f"{uuid.uuid4().hex}{file_type}"
        file_path = self.upload_dir / unique_filename
        
        total_size = 0
        
        try:
            # Asynchronous file reading and writing in chunks
            async with aiofiles.open(file_path, "wb") as out_file:
                while chunk := await file.read(AVATAR_CHUNK_SIZE):  # Reading 1 MB chunks
                    total_size += len(chunk)
                    
                    if total_size > AVATAR_MAX_SIZE_BYTES:          # Checks the file size; if it exceeds the maximum, it stops writing
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"File too large. Max size: {AVATAR_MAX_SIZE_BYTES}"
                        )
                    
                    await out_file.write(chunk)
            
            if total_size == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Avatar file is empty"
                )
                    
        except HTTPException:
            file_path.unlink(missing_ok=True)   # Stop writing to the file if the limit is exceeded, and delete the unwritten portion of the file
            raise
            
        except Exception:
            file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error occured while saving the file"
            )
                
        return unique_filename
    
    
    def delete_avatar(
        self,
        avatar_url: str | None
    ) -> None:
        """Deletes the old avatar file from the disk, if it exists. Accepts a URL or path, extracts the filename, and deletes it"""
        
        if not avatar_url:
            return
        
        filename = avatar_url.split("/")[-1]                # Returns the last element (file name)
        
        if not filename:
            return
        
        file_path = (self.upload_dir / filename).resolve()  # Returns the absolute path
        resolved_upload_file = self.upload_dir.resolve()    # Returns the absolute path of the transferred file
        
        if file_path.is_file() and file_path.parent == resolved_upload_file:
            file_path.unlink(missing_ok=True)
        