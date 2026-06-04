from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import CategoryModel
from src.utils.catalog_seed import CATEGORIES


class CategoryService:
    """
    Public category catalog service
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _ensure_default_categories(self) -> None:
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

                continue

            self.db.add(
                CategoryModel(
                    name=seed.name,
                    image_url=seed.image_url,
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
        await self._ensure_default_categories()

        category_names = [seed.name for seed in CATEGORIES]
        query = (
            select(CategoryModel)
            .where(CategoryModel.name.in_(category_names))
            .order_by(CategoryModel.id)
        )

        try:
            result = await self.db.execute(query)

        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load categories",
            ) from exc

        categories_by_name = {}

        for category in result.scalars().all():
            categories_by_name.setdefault(category.name, category)

        return [
            categories_by_name[name]
            for name in category_names
            if name in categories_by_name
        ]
