from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
import secrets

from src.core.dependencies import AdminDependency, CategoryServiceDependency
from src.schemas import CreateCategoryDTO, ReadCategoryDTO, UpdateCategoryDTO
from src.core.config import settings


# This router exposes the public category list and protected admin category actions.
router = APIRouter(tags=["Categories"])

# Checks the extra secret header required for changes to the category catalogue.
def require_category_secret(value: str | None = Header(default=None, alias="X-Category-Secret")):
    expected = settings.CATEGORY_MANAGEMENT_SECRET
    if not expected or not value or not secrets.compare_digest(value, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid category management secret")


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
    _: None = Depends(require_category_secret),
):
    """Creates a new category after the admin role and management secret are verified."""
    return await category_service.create_category(schema)

@router.patch("/admin/categories/{category_id}", response_model=ReadCategoryDTO, dependencies=[])
async def update_category(category_id: int, schema: UpdateCategoryDTO, admin: AdminDependency, category_service: CategoryServiceDependency, _: None = Depends(require_category_secret)):
    """Updates the name, image, or display details of an existing category."""
    return await category_service.update_category(category_id, schema)

@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, admin: AdminDependency, category_service: CategoryServiceDependency, _: None = Depends(require_category_secret)):
    """Deletes a category after both administrator checks succeed."""
    await category_service.delete_category(category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
