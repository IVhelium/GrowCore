from datetime import datetime
import time
import random
from decimal import Decimal
import uuid
from faker import Faker
from fastapi import APIRouter, HTTPException
from sqlalchemy import insert, select
from src.dependencies import SessionDependency
from src.database import engine
from src.models import (Base, UserModel, RoleModel, UserRoleModel, CategoryModel, 
    StoreModel, ProductModel, ProductImageModel, CartModel, CartItemModel, OrderModel, OrderItemModel, ReviewModel, SellerRequestModel, RoleStatus, OrderStatus)

# Config endpoints
router = APIRouter()

fake = Faker()

# Setup database
@router.post("/setup_database", tags=["Config"])
async def setup_database():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    
    return {"success": True, "message": "Database setup completed successfully"}


# Add Test data
@router.post("/add_test_data", tags=["Config"])
async def add_test_data(db: SessionDependency):
    try:
        # 1. РОЛИ
        result = await db.execute(select(RoleModel))
        roles = result.scalars().all()
        if not roles:
            roles = [RoleModel(role=status) for status in RoleStatus]
            db.add_all(roles)
            await db.flush()

        # 2. КАТЕГОРИИ
        categories = [CategoryModel(name=n) for n in ["Электроника", "Книги", "Дом"]]
        db.add_all(categories)
        await db.flush()

        # 3. ПОЛЬЗОВАТЕЛИ, КОРЗИНЫ и РОЛИ
        users = []
        carts = []
        for _ in range(3):
            user = UserModel(
                username=f"{fake.user_name()}_{uuid.uuid4().hex[:4]}",
                email=fake.email(),
                password_hash="fake_hash"
            )
            db.add(user)
            await db.flush()
            users.append(user)
            
            # Привязываем роль "User"
            db.add(UserRoleModel(user_id=user.id, role_id=roles[0].id))
            
            # Создаем КОРЗИНУ (CartModel)
            cart = CartModel(user_id=user.id)
            db.add(cart)
            await db.flush()
            carts.append(cart)

        # 4. ЗАПРОСЫ В ПРОДАВЦЫ
        for user in users:
            db.add(SellerRequestModel(
                passport_id=uuid.uuid4().hex[:10],
                full_name=fake.name(),
                phone_number=f"+7{random.randint(1000000000, 9999999999)}",
                country=fake.country(),
                message="Хочу торговать",
                user_id=user.id
            ))

        # 5. МАГАЗИН И ТОВАРЫ
        store = StoreModel(name=fake.company(), user_id=users[0].id)
        db.add(store)
        await db.flush()

        products = []
        for _ in range(5):
            product = ProductModel(
                title=fake.word().capitalize(),
                description=fake.text(max_nb_chars=50),
                price=Decimal(random.uniform(500, 5000)).quantize(Decimal("0.00")),
                quantity=20,
                store_id=store.id,
                category_id=random.choice(categories).id
            )
            db.add(product)
            await db.flush()
            products.append(product)
            
            # КАРТИНКИ ТОВАРА (ProductImageModel)
            db.add(ProductImageModel(image=fake.image_url(), product_id=product.id))

        # 6. ЭЛЕМЕНТЫ КОРЗИНЫ (CartItemModel)
        # Добавим первому пользователю пару товаров в корзину
        for p in products[:2]:
            db.add(CartItemModel(
                quantity=random.randint(1, 3),
                product_id=p.id,
                cart_id=carts[0].id
            ))

        # 7. ОТЗЫВЫ (ReviewModel)
        for p in products:
            db.add(ReviewModel(
                rating=Decimal(random.randint(1, 5)),
                comment="Отличный товар!",
                user_id=users[0].id,
                product_id=p.id
            ))

        # 8. ЗАКАЗЫ И ИХ СОСТАВ (OrderModel & OrderItemModel)
        order = OrderModel(
            status=OrderStatus.inTransit,
            total_price=float(products[0].price * 2),
            user_id=users[1].id
        )
        db.add(order)
        await db.flush()

        db.add(OrderItemModel(
            price=float(products[0].price),
            quantity=2,
            order_id=order.id,
            product_id=products[0].id
        ))
        
        start_time = time.time()
    
        # 1. Получаем ID магазина и категории (нужны существующие)
        # Предполагаем, что вы уже запустили обычный сид и они есть
        store_res = await db.execute(select(StoreModel.id).limit(1))
        category_res = await db.execute(select(CategoryModel.id).limit(1))
        
        target_store_id = store_res.scalar()
        target_category_id = category_res.scalar()

        if not target_store_id or not target_category_id:
            raise HTTPException(status_code=400, detail="Сначала создайте хотя бы один магазин и категорию!")

        total_count = 1_000_000
        chunk_size = 50_000 # Размер одной пачки
        
        print(f"Начинаю вставку {total_count} записей...")

        for i in range(0, total_count, chunk_size):
        # Генерируем пачку данных как простые словари (это быстро)
            batch = [
                {
                    "title": f"Product {j}",
                    "description": f"Description for product {j}",
                    "price": Decimal(random.uniform(10, 10000)).quantize(Decimal("0.00")),
                    "quantity": random.randint(1, 1000),
                    "enabled": True,
                    "store_id": target_store_id,
                    "category_id": target_category_id,
                    "created_at": datetime.now() # Убедитесь, что тип совпадает (с зоной или без)
                }
                for j in range(i, i + chunk_size)
            ]
            
            # Массовая вставка напрямую через SQL-выражение
            await db.execute(insert(ProductModel), batch)
            
            # Коммитим каждую пачку, чтобы данные сохранялись постепенно
            await db.commit()
            print(f"Готово: {i + chunk_size} / {total_count}")

        end_time = time.time()
        duration = end_time - start_time



        await db.commit()
        return {
            "status": "success", 
            "total": total_count, 
            "time_seconds": round(duration, 2),
            "speed_per_second": round(total_count / duration, 0)
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")