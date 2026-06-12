# GrowCore

## English

### Project Overview

GrowCore is a marketplace for garden automation parts and greenhouse equipment. The project combines a public product catalog, shopping cart, favorites, checkout, order history, product reviews, seller workflows, moderation tools, and support/admin panels.

The main theme of the application is smart gardening and agricultural automation: sensors, irrigation parts, controllers, valves, pumps, greenhouse modules, and related replacement components.

### Main Features

- Public catalog with search, pagination, sorting, category filters, price filters, availability filters, seller filters, and dynamic product attributes.
- Product cards with images, rating, price, stock quantity, favorites, and cart actions.
- Product detail page with gallery, delivery information, reviews, rating submission, and related products.
- Cart with one cart position per product; quantity is changed inside the cart.
- Checkout flow that creates order history instead of simply removing products from the UI.
- Favorites and move-to-cart workflow.
- User authentication with cookie-based JWT access and refresh tokens.
- User profile editing and avatar upload.
- Seller request flow and seller store page.
- Seller product creation, image upload, editing, moderation submission, and availability management.
- Admin moderation for seller requests and product approvals/rejections.
- Support tickets and support panel.
- File storage for public media.
- Database migrations with Alembic.

### Technology Stack

#### Frontend

- React 19
- Vite
- React Router
- TanStack React Query
- Axios
- Tailwind CSS 4
- Ant Design popovers
- Lucide React icons

#### Backend

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy 2 async ORM
- AsyncPG
- Pydantic 2
- Pydantic Settings
- Alembic
- AuthX/JWT authentication
- Passlib/Bcrypt password hashing
- Multipart file uploads

#### Infrastructure

- PostgreSQL 16
- Docker
- Docker Compose
- Vite development proxy

### Repository Structure

```text
GrowCore/
  backend/
    src/
      api/           FastAPI routers and services
      core/          configuration, security, database, constants
      models/        SQLAlchemy models
      schemas/       Pydantic DTOs
      migrations/    Alembic migrations
      utils/         seed and helper utilities
    Dockerfile
    requirements.txt
  frontend/
    src/
      api/           Axios API clients and normalizers
      components/    reusable UI components
      hooks/         React data/state hooks
      layout/        shared app shell
      pages/         route pages
      routes/        protected/product route wrappers
      utils/         formatting and catalog helpers
    Dockerfile
    package.json
  docker-compose.yml
```

### Environment Variables

The backend expects `backend/.env`:

```env
POSTGRES_USER=growcore
POSTGRES_PASSWORD=growcore_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=growcore

JWT_SECRET=change-me
JWT_ACCESS_COOKIE_NAME=growcore_access
JWT_REFRESH_COOKIE_NAME=growcore_refresh

FRONTEND_URL=http://localhost:5173
RUN_STAFF_SEED=false
```

Optional staff seed variables:

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin-password

SEED_SUPPORT_USERNAME=support
SEED_SUPPORT_EMAIL=support@example.com
SEED_SUPPORT_PASSWORD=support-password
UPDATE_SEEDED_USERS_PASSWORDS=false
```

The frontend can use `frontend/.env`:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://backend:8000
```

### Running With Docker

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

The backend container runs Alembic migrations automatically from `backend/entrypoint.sh`.

### Running Locally

Start PostgreSQL first, then create a backend `.env` where `POSTGRES_HOST` points to your local database host.

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

On Windows PowerShell, if script execution blocks `npm`, use:

```bash
npm.cmd run dev
```

### Database Migrations

Create a migration:

```bash
cd backend
alembic revision --autogenerate -m "migration name"
```

Apply migrations:

```bash
alembic upgrade head
```

Rollback one migration:

```bash
alembic downgrade -1
```

### User Roles

- User: browse catalog, manage cart/favorites, checkout, review products, manage profile.
- Seller: create a store, submit products for moderation, edit products, manage availability.
- Support: view and process support requests.
- Admin: moderate seller requests and product submissions.

### Key Workflows

1. A visitor browses the catalog, filters products, opens a product page, and adds a product to the cart.
2. The cart stores each product only once; quantity is changed from the cart page.
3. Checkout creates an order and moves purchased items into order history.
4. A seller creates a product, uploads an image, adds catalog filter attributes, and submits it for moderation.
5. An admin approves the product, after which it becomes visible in the public catalog.
6. Buyers can leave non-empty reviews with ratings.

### Notes

- Dynamic catalog filters are generated from product attributes.
- Product images are stored through backend public storage and served as media files.
- The Vite dev server proxies `/api` requests to the backend.
- The project is designed as a learning/full-stack marketplace application, not a production-hardened payment platform.

---

## Русский

### Описание проекта

GrowCore - это маркетплейс товаров для автоматизации сада, теплиц и полива. Проект объединяет публичный каталог товаров, корзину, избранное, оформление заказов, историю заказов, отзывы, кабинет продавца, модерацию товаров и заявок, а также поддержку.

Основная тема приложения - умное садоводство и агроавтоматизация: датчики, элементы полива, контроллеры, клапаны, насосы, модули для теплиц и комплектующие.

### Основные возможности

- Публичный каталог с поиском, пагинацией, сортировкой, фильтрами по категориям, цене, наличию, продавцу и динамическим характеристикам товара.
- Карточки товаров с изображением, рейтингом, ценой, остатком, избранным и добавлением в корзину.
- Страница товара с галереей, информацией о доставке, отзывами, рейтингом и похожими товарами.
- Корзина: один товар добавляется как одна позиция, количество меняется только в корзине.
- Checkout создает историю заказов, поэтому товары после покупки не исчезают бесследно.
- Избранное и перенос избранных товаров в корзину.
- Аутентификация пользователей через JWT в cookies.
- Редактирование профиля и загрузка аватара.
- Заявка на роль продавца и страница магазина продавца.
- Создание товара продавцом, загрузка изображения, редактирование, отправка на модерацию и управление доступностью.
- Админская модерация заявок продавцов и товаров.
- Система обращений в поддержку.
- Хранение публичных медиафайлов.
- Миграции базы данных через Alembic.

### Использованные технологии

#### Frontend

- React 19
- Vite
- React Router
- TanStack React Query
- Axios
- Tailwind CSS 4
- Ant Design popovers
- Lucide React icons

#### Backend

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy 2 async ORM
- AsyncPG
- Pydantic 2
- Pydantic Settings
- Alembic
- AuthX/JWT authentication
- Passlib/Bcrypt для хеширования паролей
- Multipart file uploads

#### Инфраструктура

- PostgreSQL 16
- Docker
- Docker Compose
- Vite development proxy

### Структура проекта

```text
GrowCore/
  backend/
    src/
      api/           роутеры и сервисы FastAPI
      core/          конфигурация, безопасность, база данных, константы
      models/        модели SQLAlchemy
      schemas/       DTO-схемы Pydantic
      migrations/    миграции Alembic
      utils/         seed-утилиты и вспомогательный код
    Dockerfile
    requirements.txt
  frontend/
    src/
      api/           API-клиенты Axios и нормализация данных
      components/    переиспользуемые UI-компоненты
      hooks/         React hooks для данных и состояния
      layout/        общий layout приложения
      pages/         страницы маршрутов
      routes/        protected/product route wrappers
      utils/         форматирование и helpers каталога
    Dockerfile
    package.json
  docker-compose.yml
```

### Переменные окружения

Backend ожидает файл `backend/.env`:

```env
POSTGRES_USER=growcore
POSTGRES_PASSWORD=growcore_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=growcore

JWT_SECRET=change-me
JWT_ACCESS_COOKIE_NAME=growcore_access
JWT_REFRESH_COOKIE_NAME=growcore_refresh

FRONTEND_URL=http://localhost:5173
RUN_STAFF_SEED=false
```

Опциональные переменные для seed-пользователей:

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin-password

SEED_SUPPORT_USERNAME=support
SEED_SUPPORT_EMAIL=support@example.com
SEED_SUPPORT_PASSWORD=support-password
UPDATE_SEEDED_USERS_PASSWORDS=false
```

Frontend может использовать `frontend/.env`:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://backend:8000
```

### Запуск через Docker

```bash
docker compose up --build
```

Сервисы:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

Backend-контейнер автоматически применяет Alembic-миграции через `backend/entrypoint.sh`.

### Локальный запуск

Сначала запустите PostgreSQL и настройте `backend/.env`, указав локальный `POSTGRES_HOST`.

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Если Windows PowerShell блокирует запуск `npm`, используйте:

```bash
npm.cmd run dev
```

### Миграции базы данных

Создать миграцию:

```bash
cd backend
alembic revision --autogenerate -m "migration name"
```

Применить миграции:

```bash
alembic upgrade head
```

Откатить одну миграцию:

```bash
alembic downgrade -1
```

### Роли пользователей

- User: просмотр каталога, корзина, избранное, оформление заказа, отзывы, профиль.
- Seller: создание магазина, отправка товаров на модерацию, редактирование товаров, управление доступностью.
- Support: обработка обращений в поддержку.
- Admin: модерация заявок продавцов и товаров.

### Основные сценарии

1. Пользователь просматривает каталог, применяет фильтры, открывает товар и добавляет его в корзину.
2. В корзине один товар хранится как одна позиция; количество меняется только на странице корзины.
3. После оформления заказа создается запись в истории заказов.
4. Продавец создает товар, загружает изображение, добавляет характеристики для фильтров и отправляет товар на модерацию.
5. Администратор одобряет товар, после чего он появляется в публичном каталоге.
6. Покупатели могут оставлять непустые отзывы с рейтингом.

### Примечания

- Динамические фильтры каталога создаются из характеристик товаров.
- Изображения товаров и аватары обслуживаются backend-хранилищем публичных файлов.
- Vite dev server проксирует `/api` запросы на backend.
- Проект сделан как учебное/full-stack marketplace приложение, а не как production-ready платформа с платежами.
