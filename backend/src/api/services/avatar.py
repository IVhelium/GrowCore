import aiofiles
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from backend.src.core.constants import (
    ALLOWED_AVATAR_CONTENT_TYPES,
    AVATAR_MAX_SIZE_BYTES,
    AVATAR_CHUNK_SIZE,
    AVATAR_DIR
)


class AvatarService:
    def __init__(self):
        self.upload_dir = AVATAR_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)  # Проверка существования папки
        
    
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
        """Сохраняет аватар на диск, генерируя уникальное имя. Возвращает только имя сохраненного файла"""
        
        normalized_content_type = self.normalize_content_type(file.content_type)
        
        file_type = ALLOWED_AVATAR_CONTENT_TYPES[normalized_content_type]
        unique_filename = f"{uuid.uuid4().hex}{file_type}"
        file_path = self.upload_dir / unique_filename
        
        total_size = 0
        
        try:
            # Асинхранное чтение и запись файла чанками
            async with aiofiles.open(file_path, "wb") as out_file:
                while chunk := await file.read(AVATAR_CHUNK_SIZE):  # Чтение чанков по 1 МБ
                    total_size += len(chunk)
                    
                    if total_size > AVATAR_MAX_SIZE_BYTES:          # Проверяет размер файла, если больше максимума прерывает запись
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
            file_path.unlink(missing_ok=True)   # Прерывем запись файла если больше лимита, и уудаляет недозаписанный кусок файла
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
        """Удаляет старый файл аватара с диска, если он существует. Принимает URL или путь, извлекает имя файла и удаляет его"""
        
        if not avatar_url:
            return
        
        filename = avatar_url.split("/")[-1]                # Возвращает последний элемент (имя файла)
        
        if not filename:
            return
        
        file_path = (self.upload_dir / filename).resolve()  # Возвращает абсолютный путь
        resolved_upload_file = self.upload_dir.resolve()    # Возвразает абсолютный путь переданного файла
        
        if file_path.is_file() and file_path.parent == resolved_upload_file:
            file_path.unlink(missing_ok=True)
        