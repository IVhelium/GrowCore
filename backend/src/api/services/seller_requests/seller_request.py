from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.core.constants import SellerRequestStatus
from src.core.upload_policies import SELLER_DOCUMENT_POLICY
from src.api.services.files.file_storage import FileStorageService
from src.models import SellerRequestModel, UserModel
from src.schemas import (
    CreateSellerRequestDTO,
    ResubmitSellerRequestDTO,
)

from .seller_request_base import SellerRequestBaseService
from src.utils.storage_paths import seller_request_documents_directory_key


class SellerRequestService(SellerRequestBaseService):
    """
    Seller's Custom Order Service
    Responsibilities:
    - Creating orders
    - Viewing your orders
    - Resubmitting rejected orders
    """

    async def get_my_request(
        self,
        current_user: UserModel,
    ) -> SellerRequestModel:
        """
        Returns the current user's request
        """

        return await self._get_my_request(current_user)

    async def create_request(
        self,
        current_user: UserModel,
        schema: CreateSellerRequestDTO,
        document: UploadFile,
    ) -> SellerRequestModel:
        """
        Creates an application to become a seller
        If an application already exists, a new one is not created
        For rejected applications, use the resubmit endpoint
        """

        query = (
            select(SellerRequestModel)
            .where(SellerRequestModel.user_id == current_user.id)
        )

        try:
            result = await self.db.execute(query)
            existing_request = result.scalar_one_or_none()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not check existing seller request",
            ) from exc

        if existing_request:
            if existing_request.status == SellerRequestStatus.pending:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Seller request is already pending",
                )

            if existing_request.status == SellerRequestStatus.approved:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Seller request is already approved",
                )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Rejected request already exists. Use resubmit endpoint",
            )

        seller_request = SellerRequestModel(
            passport_id=schema.passport_id.strip(),
            full_name=schema.full_name.strip(),
            phone_number=schema.phone_number.strip(),
            country=schema.country.strip(),
            message=schema.message.strip(),
            status=SellerRequestStatus.pending,
            user_id=current_user.id,
        )

        stored_file = None

        try:
            self.db.add(seller_request)
            await self.db.flush()

            stored_file = await self.file_storage_service.save_file(
                file=document,
                policy=SELLER_DOCUMENT_POLICY,
                directory_key=seller_request_documents_directory_key(
                    user=current_user,
                    request_id=seller_request.id,
                ),
            )

            seller_request.document_storage_key = stored_file.storage_key
            seller_request.document_name = document.filename or "seller-document.pdf"
            seller_request.document_content_type = stored_file.content_type

            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()
            if stored_file is not None:
                self.file_storage_service.delete_by_storage_key(
                    storage_key=stored_file.storage_key,
                    policy=SELLER_DOCUMENT_POLICY,
                )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Passport ID or phone number already exists",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()
            if stored_file is not None:
                self.file_storage_service.delete_by_storage_key(
                    storage_key=stored_file.storage_key,
                    policy=SELLER_DOCUMENT_POLICY,
                )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create seller request",
            ) from exc

        return await self._get_request_by_id(seller_request.id)


    async def resubmit_my_request(
        self,
        current_user: UserModel,
        schema: ResubmitSellerRequestDTO,
        document: UploadFile,
    ) -> SellerRequestModel:
        """
        Resubmits a rejected request for review
        The user can update some of the fields. After that, the request
        becomes pending again
        """

        seller_request = await self._get_my_request(current_user)

        if seller_request.status != SellerRequestStatus.rejected:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only rejected seller request can be resubmitted",
            )

        data = schema.model_dump(exclude_unset=True, exclude_none=True)

        if not data and document is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No data provided for resubmit",
            )

        for field, value in data.items():
            if isinstance(value, str):
                value = value.strip()

                if not value:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"{field} cannot be empty",
                    )

            setattr(seller_request, field, value)

        old_document_storage_key = seller_request.document_storage_key
        stored_file = await self.file_storage_service.save_file(
            file=document,
            policy=SELLER_DOCUMENT_POLICY,
            directory_key=seller_request_documents_directory_key(
                user=current_user,
                request_id=seller_request.id,
            ),
        )

        seller_request.document_storage_key = stored_file.storage_key
        seller_request.document_name = document.filename or "seller-document.pdf"
        seller_request.document_content_type = stored_file.content_type

        seller_request.status = SellerRequestStatus.pending
        seller_request.rejection_reason = None
        seller_request.reviewed_at = None
        seller_request.reviewer_id = None

        try:
            await self.db.commit()

        except IntegrityError as exc:
            await self._safe_rollback()
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=SELLER_DOCUMENT_POLICY,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Passport ID or phone number already exists",
            ) from exc

        except SQLAlchemyError as exc:
            await self._safe_rollback()
            self.file_storage_service.delete_by_storage_key(
                storage_key=stored_file.storage_key,
                policy=SELLER_DOCUMENT_POLICY,
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not resubmit seller request",
            ) from exc

        self.file_storage_service.delete_by_storage_key(
            storage_key=old_document_storage_key,
            policy=SELLER_DOCUMENT_POLICY,
        )

        return await self._get_request_by_id(seller_request.id)
    def __init__(
        self,
        db,
        file_storage_service: FileStorageService,
    ):
        super().__init__(db)
        self.file_storage_service = file_storage_service
