from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import CategoryModel
from src.schemas import CreateCategoryDTO, UpdateCategoryDTO
from src.utils.catalog_seed import CATEGORIES


# Manages category data used to organise products in the public catalogue.
class CategoryService:

    def __init__(self, db: AsyncSession):
        # Store the database session used for category queries and updates.
        self.db = db

    async def _ensure_default_categories(self) -> None:
        """Adds missing default categories and refreshes their saved metadata."""
        changed = False

        for seed in CATEGORIES:
            result = await self.db.execute(
                select(CategoryModel).where(CategoryModel.name == seed.name)
            )
            category = result.scalar_one_or_none()

            if category:
                if category.image_url != seed.image_url:
                    category.image_url = seed.image_url
                    changed = True

                if category.icon_name != seed.icon_name:
                    category.icon_name = seed.icon_name
                    changed = True

                continue

            self.db.add(
                CategoryModel(
                    name=seed.name,
                    image_url=seed.image_url,
                    icon_name=seed.icon_name,
                )
            )
            changed = True

        if not changed:
            return

        try:
            await self.db.commit()

        except IntegrityError as exc:
            await self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category seed conflict",
            ) from exc

        except SQLAlchemyError as exc:
            await self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not prepare categories",
            ) from exc


    async def list_categories(self) -> list[CategoryModel]:
        """Returns categories in the order chosen for the catalogue interface."""
        query = (
            select(CategoryModel)
            .order_by(CategoryModel.sort_order, CategoryModel.name)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load categories",
            ) from exc

        return list(result.scalars().all())

    async def create_category(self, schema: CreateCategoryDTO) -> CategoryModel:
        """Creates a category after cleaning its name and checking for duplicates."""
        name = schema.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Category name is required",
            )

        existing_result = await self.db.execute(
            select(CategoryModel).where(CategoryModel.name == name)
        )

        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            )

        last_order = await self.db.scalar(select(func.max(CategoryModel.sort_order))) or 0
        category = CategoryModel(name=name, image_url="", icon_name=schema.icon_name, sort_order=last_order + 10)

        try:
            self.db.add(category)
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            ) from exc
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create category",
            ) from exc

        return category

    async def update_category(self, category_id: int, schema: UpdateCategoryDTO) -> CategoryModel:
        category = await self.db.get(CategoryModel, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        data = schema.model_dump(exclude_unset=True)
        if "name" in data:
            data["name"] = data["name"].strip()
            if not data["name"]:
                raise HTTPException(status_code=422, detail="Category name is required")
        for field, value in data.items():
            setattr(category, field, value)
        try:
            await self.db.commit()
            await self.db.refresh(category)
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(status_code=409, detail="Category already exists") from exc
        return category

    async def delete_category(self, category_id: int) -> None:
        category = await self.db.get(CategoryModel, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        try:
            await self.db.delete(category)
            await self.db.commit()
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail="Could not delete category") from exc
