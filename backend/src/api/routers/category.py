from fastapi import APIRouter

from src.core.dependencies import AdminDependency, CategoryServiceDependency
from src.schemas import CreateCategoryDTO, ReadCategoryDTO


router = APIRouter(tags=["Categories"])


@router.get(
    "/categories",
    response_model=list[ReadCategoryDTO],
)
async def list_categories(
    category_service: CategoryServiceDependency,
):
    """
    Returns the public category catalog.
    """

    return await category_service.list_categories()


@router.post(
    "/admin/categories",
    response_model=ReadCategoryDTO,
)
async def create_category(
    schema: CreateCategoryDTO,
    admin: AdminDependency,
    category_service: CategoryServiceDependency,
):
    return await category_service.create_category(schema)
