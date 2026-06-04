from fastapi import APIRouter

from src.core.dependencies import CategoryServiceDependency
from src.schemas import ReadCategoryDTO


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
