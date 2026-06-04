from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from src.core.constants import ProductModerationStatus, RoleStatus
from src.core.security import hash_password
from src.models import (
    CategoryModel,
    ProductImageModel,
    ProductModel,
    RoleModel,
    StoreModel,
    UserModel,
    UserRoleModel,
)
from src.utils.staff_seed.roles import ensure_all_roles


@dataclass(frozen=True)
class CategorySeed:
    name: str
    image_url: str


@dataclass(frozen=True)
class ProductSeed:
    title: str
    description: str
    price: str
    quantity: int
    category_name: str
    image: str
    rating_avg: str
    rating_count: int


SELLER_USERNAME = "growcore-seller"
SELLER_EMAIL = "seller@growcore.dev"
SELLER_PASSWORD = "seller123"
STORE_NAME = "GrowCore Store"


CATEGORIES = [
    CategorySeed(
        name="Soil Sensors",
        image_url="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Climate Sensors",
        image_url="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Irrigation Parts",
        image_url="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Greenhouse Control",
        image_url="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Grow Lights",
        image_url="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Pumps & Valves",
        image_url="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Cables & Connectors",
        image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Replacement Parts",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    ),
    CategorySeed(
        name="Hydroponics",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop"
    ),
    CategorySeed(
        name="Controllers",
        image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop"
    )
]


PRODUCTS = [
    ProductSeed(
        title="Soil Moisture Sensor V2",
        description="Compact soil moisture sensor for smart irrigation, greenhouse monitoring, and small garden automation.",
        price="24.00",
        quantity=999,
        category_name="Soil Sensors",
        image="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.7",
        rating_count=18,
    ),
    ProductSeed(
        title="Smart Irrigation Valve",
        description="Wireless irrigation valve for automated watering schedules and precise flow control in garden beds.",
        price="46.00",
        quantity=999,
        category_name="Irrigation Parts",
        image="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.6",
        rating_count=14,
    ),
    ProductSeed(
        title="Water Pump 12V Mini",
        description="Compact pump for hydroponics, tabletop irrigation systems, and light-duty water circulation.",
        price="29.00",
        quantity=999,
        category_name="Pumps & Valves",
        image="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.8",
        rating_count=21,
    ),
    ProductSeed(
        title="Full Spectrum LED Board",
        description="Replacement grow-light board for seedlings, herbs, and indoor plant shelves with balanced spectrum.",
        price="64.00",
        quantity=999,
        category_name="Grow Lights",
        image="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.5",
        rating_count=11,
    ),
    ProductSeed(
        title="Greenhouse Climate Controller",
        description="Controller for greenhouse fans, vents, and heaters with simple automation for stable growing conditions.",
        price="89.00",
        quantity=999,
        category_name="Greenhouse Control",
        image="https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.9",
        rating_count=9,
    ),
    ProductSeed(
        title="Temperature Humidity Sensor",
        description="Digital temperature and humidity sensor module for climate tracking in grow rooms and greenhouses.",
        price="19.00",
        quantity=999,
        category_name="Climate Sensors",
        image="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=700&auto=format&fit=crop",
        rating_avg="4.4",
        rating_count=16,
    ),
]


async def _get_user_by_email(db, email: str) -> UserModel | None:
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    return result.scalar_one_or_none()


async def _ensure_seller_user(
    db,
    roles: dict[RoleStatus, RoleModel],
) -> UserModel:
    user = await _get_user_by_email(db, SELLER_EMAIL)

    if not user:
        user = UserModel(
            username=SELLER_USERNAME,
            email=SELLER_EMAIL,
            password_hash=hash_password(SELLER_PASSWORD),
        )
        db.add(user)
        await db.flush()

    for role_status in (RoleStatus.user, RoleStatus.seller):
        role = roles[role_status]
        result = await db.execute(
            select(UserRoleModel).where(
                UserRoleModel.user_id == user.id,
                UserRoleModel.role_id == role.id,
            )
        )

        if result.scalar_one_or_none():
            continue

        db.add(UserRoleModel(user_id=user.id, role_id=role.id))

    return user


async def _ensure_store(db, seller: UserModel) -> StoreModel:
    result = await db.execute(
        select(StoreModel).where(StoreModel.user_id == seller.id)
    )
    store = result.scalar_one_or_none()

    if store:
        return store

    store = StoreModel(
        name=STORE_NAME,
        description="Demo storefront for GrowCore catalog testing.",
        user_id=seller.id,
    )
    db.add(store)
    await db.flush()

    return store


async def _ensure_categories(db) -> dict[str, CategoryModel]:
    categories: dict[str, CategoryModel] = {}

    for seed in CATEGORIES:
        result = await db.execute(
            select(CategoryModel).where(CategoryModel.name == seed.name)
        )
        category = result.scalar_one_or_none()

        if not category:
            category = CategoryModel(
                name=seed.name,
                image_url=seed.image_url,
            )
            db.add(category)
            await db.flush()
        else:
            category.image_url = seed.image_url

        categories[seed.name] = category

    return categories


async def _ensure_products(
    db,
    store: StoreModel,
    categories: dict[str, CategoryModel],
) -> None:
    for seed in PRODUCTS:
        result = await db.execute(
            select(ProductModel).where(ProductModel.title == seed.title)
        )
        product = result.scalar_one_or_none()

        if not product:
            product = ProductModel(
                title=seed.title,
                description=seed.description,
                price=Decimal(seed.price),
                quantity=seed.quantity,
                enabled=True,
                rating_avg=Decimal(seed.rating_avg),
                rating_count=seed.rating_count,
                moderation_status=ProductModerationStatus.approved,
                store_id=store.id,
                category_id=categories[seed.category_name].id,
            )
            db.add(product)
            await db.flush()

        product.enabled = True
        product.quantity = max(product.quantity, seed.quantity)
        product.moderation_status = ProductModerationStatus.approved

        image_result = await db.execute(
            select(ProductImageModel).where(
                ProductImageModel.product_id == product.id,
                ProductImageModel.image == seed.image,
            )
        )

        if image_result.scalar_one_or_none():
            continue

        db.add(
            ProductImageModel(
                product_id=product.id,
                image=seed.image,
            )
        )


async def run_catalog_seed(
    async_session_maker: async_sessionmaker,
) -> None:
    async with async_session_maker() as db:
        async with db.begin():
            roles = await ensure_all_roles(db)
            seller = await _ensure_seller_user(db, roles)
            store = await _ensure_store(db, seller)
            categories = await _ensure_categories(db)
            await _ensure_products(db, store, categories)
