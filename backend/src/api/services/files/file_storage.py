import uuid
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlparse
import aiofiles
from fastapi import HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from src.api.services.files.file_validator import FileValidator
from src.core.config import settings
from src.core.upload_policies import UploadPolicy


@dataclass
class StoredFile:
    storage_key: str
    filesystem_path: Path | None
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
        if settings.FILE_STORAGE_BACKEND == "cloudinary":
            return await self._save_cloudinary_file(
                file=file,
                policy=policy,
                directory_key=directory_key,
            )

        return await self._save_local_file(
            file=file,
            policy=policy,
            directory_key=directory_key,
        )

    async def _save_local_file(
        self,
        file: UploadFile,
        policy: UploadPolicy,
        directory_key: str,
    ) -> StoredFile:
        """Saves the file to local disk."""

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
            
            filename = f"{uuid.uuid4().hex}{validated_upload.extension}"
            
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
            
        except Exception as exc:
            if filesystem_path is not None:
                filesystem_path.unlink(missing_ok=True)
                
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occurred while saving the file",
            ) from exc
            
        finally:
            await file.close()

    async def _save_cloudinary_file(
        self,
        file: UploadFile,
        policy: UploadPolicy,
        directory_key: str,
    ) -> StoredFile:
        """Saves the file to Cloudinary."""

        try:
            validated_upload = await self.validator.validate(
                file=file,
                policy=policy,
            )
            validated_directory_key = self._validate_directory_key(
                directory_key=directory_key,
                policy=policy,
            )

            content = await self._read_upload_content(
                file=file,
                policy=policy,
            )
            resource_type = self._cloudinary_resource_type(
                content_type=validated_upload.content_type,
            )
            public_id = self._cloudinary_public_id(
                directory_key=validated_directory_key,
            )

            upload_result = await run_in_threadpool(
                self._upload_to_cloudinary,
                content=content,
                public_id=public_id,
                resource_type=resource_type,
                content_type=validated_upload.content_type,
                original_filename=file.filename,
                is_public=policy.is_public,
            )

            secure_url = upload_result.get("secure_url")

            if policy.is_public and not secure_url:
                await run_in_threadpool(
                    self._destroy_cloudinary_file,
                    storage_key=f"{resource_type}/{public_id}",
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Cloudinary public URL is not configured",
                )

            return StoredFile(
                storage_key=f"{resource_type}/{upload_result.get('public_id', public_id)}",
                filesystem_path=None,
                public_url=secure_url if policy.is_public else None,
                content_type=validated_upload.content_type,
                size_bytes=len(content),
            )

        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occurred while saving the file",
            ) from exc
        finally:
            await file.close()

    async def _read_upload_content(
        self,
        file: UploadFile,
        policy: UploadPolicy,
    ) -> bytes:
        total_size = 0
        chunks: list[bytes] = []

        await file.seek(0)

        while chunk := await file.read(policy.chunk_size_bytes):
            total_size += len(chunk)

            if total_size > policy.max_size_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"File too large. Max size: {policy.max_size_bytes}",
                )

            chunks.append(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty",
            )

        return b"".join(chunks)
            
            
    def delete_by_public_url(
        self,
        public_url: str | None,
        policy: UploadPolicy
    ) -> None:
        """Deletes a public file by URL from the database"""
        
        if not public_url:
            return

        if settings.FILE_STORAGE_BACKEND == "cloudinary":
            storage_key = self._cloudinary_storage_key_from_url(public_url)

            if storage_key:
                self.delete_by_storage_key(
                    storage_key=storage_key,
                    policy=policy,
                )

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

        if settings.FILE_STORAGE_BACKEND == "cloudinary":
            self._destroy_cloudinary_file(storage_key=storage_key)
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

    def _configure_cloudinary(self):
        import cloudinary

        if settings.CLOUDINARY_URL:
            parsed_url = urlparse(settings.CLOUDINARY_URL)
            cloud_name = parsed_url.hostname
            api_key = unquote(parsed_url.username or "")
            api_secret = unquote(parsed_url.password or "")

            if not cloud_name or not api_key or not api_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="CLOUDINARY_URL must be cloudinary://<api-key>:<api-secret>@<cloud-name>",
                )

            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True,
            )
            return

        missing_values = [
            name
            for name, value in {
                "CLOUDINARY_CLOUD_NAME": settings.CLOUDINARY_CLOUD_NAME,
                "CLOUDINARY_API_KEY": settings.CLOUDINARY_API_KEY,
                "CLOUDINARY_API_SECRET": settings.CLOUDINARY_API_SECRET,
            }.items()
            if not value
        ]

        if missing_values:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary is not configured: {', '.join(missing_values)}",
            )

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

    def _upload_to_cloudinary(
        self,
        *,
        content: bytes,
        public_id: str,
        resource_type: str,
        content_type: str,
        original_filename: str | None,
        is_public: bool,
    ) -> dict:
        import cloudinary.uploader

        self._configure_cloudinary()

        upload_file = BytesIO(content)
        upload_file.name = original_filename or f"{public_id.replace('/', '-')}"

        return cloudinary.uploader.upload(
            upload_file,
            public_id=public_id,
            resource_type=resource_type,
            overwrite=False,
            type="upload" if is_public else "authenticated",
            access_mode="public" if is_public else "authenticated",
            context={"content_type": content_type},
        )

    def _destroy_cloudinary_file(self, storage_key: str) -> None:
        import cloudinary.uploader

        self._configure_cloudinary()

        resource_type, public_id = self._split_cloudinary_storage_key(storage_key)

        for delivery_type in ("upload", "authenticated"):
            cloudinary.uploader.destroy(
                public_id,
                resource_type=resource_type,
                type=delivery_type,
                invalidate=True,
            )

    def _cloudinary_resource_type(self, content_type: str) -> str:
        if content_type.startswith("image/"):
            return "image"

        return "raw"

    def _cloudinary_public_id(self, directory_key: str) -> str:
        folder = settings.CLOUDINARY_FOLDER.strip("/")

        if folder:
            return f"{folder}/{directory_key}/{uuid.uuid4().hex}"

        return f"{directory_key}/{uuid.uuid4().hex}"

    def _split_cloudinary_storage_key(self, storage_key: str) -> tuple[str, str]:
        if "/" not in storage_key:
            return "image", storage_key

        resource_type, public_id = storage_key.split("/", 1)

        if resource_type not in {"image", "raw", "video"}:
            return "image", storage_key

        return resource_type, public_id

    def _cloudinary_storage_key_from_url(self, public_url: str) -> str | None:
        parsed_url = urlparse(public_url)
        path_parts = [part for part in parsed_url.path.split("/") if part]

        try:
            upload_index = path_parts.index("upload")
        except ValueError:
            return None

        if upload_index == 0:
            return None

        resource_type = path_parts[upload_index - 1]

        if resource_type not in {"image", "raw", "video"}:
            return None

        public_id_parts = path_parts[upload_index + 1 :]

        if not public_id_parts:
            return None

        if public_id_parts and public_id_parts[0].startswith("v") and public_id_parts[0][1:].isdigit():
            public_id_parts = public_id_parts[1:]

        public_id = "/".join(public_id_parts)

        if resource_type in {"image", "video"}:
            public_id = public_id.rsplit(".", 1)[0]

        if resource_type == "raw" and "." in public_id_parts[-1]:
            public_id = public_id.rsplit(".", 1)[0]

        if not public_id:
            return None

        return f"{resource_type}/{public_id}"
