# GrowCore

Full-stack marketplace for smart gardening, greenhouse equipment, hydroponics, irrigation, and automation components.

[English](#english) · [Русский](#русский) · [Complete bilingual documentation](PROJECT_DOCUMENTATION.md)

---

## English

### About the project

GrowCore is more than a product storefront. It models the complete marketplace workflow: visitors discover equipment, customers maintain carts and favorites, Stripe processes payments, sellers apply and submit products, administrators moderate the marketplace, support staff handle account and order questions, and users interact through follows, friendships, notifications, and real-time chat.

The repository contains a React single-page application and an asynchronous FastAPI backend backed by PostgreSQL. Business behavior is split into services, API contracts use Pydantic, schema changes use Alembic, public/private files can live locally or in Cloudinary, and the complete development environment can be started with Docker Compose.

### Main capabilities

- **Public storefront:** home page, category navigation, global search, public product and user profiles, delivery/about information, and responsive desktop/mobile navigation.
- **Catalog:** backend search, category, seller, price, stock, label, and dynamic attribute filters; popularity/price/date/random sorting and offset pagination.
- **Product pages:** gallery, discounts with expiry, stock-aware quantity selection, seller/category information, structured descriptions, attributes, ratings, threaded review replies, and related products.
- **Accounts:** registration, cookie-based JWT login, automatic token refresh, logout, public IDs, profile editing, avatar upload/removal, role-aware shortcuts, and account blocking.
- **Shopping:** authenticated persistent cart and favorites, stock validation, debounced quantity editing, individual/bulk favorite-to-cart movement, and pending-order creation.
- **Payments and fulfillment:** Stripe Checkout, signed webhooks, redirect confirmation, payment documents, platform/seller fee accounting, delivery state and tracking, order history, and return requests.
- **Seller onboarding:** private proof-document upload, admin review, rejection and resubmission, automatic seller-role/store creation, and applicant notifications.
- **Seller workspace:** store profile, listing drafts, structured descriptions and attributes with non-removable Brand and Warranty fields, image management, discount and inventory controls, moderation submission, publication toggle, and safe deletion.
- **Moderation:** draft/pending/approved/rejected/blocked/deleted listing lifecycle, evidence review, reasoned decisions, and seller notifications.
- **Social features:** user discovery, follows with abuse throttling, friend requests with messages, accept/decline/removal, searchable friend lists, and public seller stores.
- **Chat and notifications:** REST history, real-time WebSocket delivery, short-lived WebSocket tickets, message throttling, grouped notifications, read/unread actions, and live counters.
- **Support:** categorized customer tickets, history and staff responses, status workflow, staff assignment, search/filtering, and admin escalation.
- **Administration:** searchable and sortable product moderation/control, seller requests and private documents, users and sellers, Stripe transactions, delivery and returns, categories, and named seller-filter visibility.

### Roles

| Role | Main access |
|---|---|
| Guest | Browse catalog, products, categories, users, and informational pages; use temporary in-memory cart/favorites |
| User | Persistent shopping, checkout, orders, reviews, returns, profile, follows, friends, chat, notifications, support |
| Seller | User features plus store and product management |
| Support | Assigned support-ticket processing |
| Admin | Marketplace moderation and all administrative controls |

Roles are additive: an account may have several roles.

### Technology

- Frontend: React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, TanStack Query, Ant Design, Lucide React.
- Backend: Python 3.12, FastAPI, Pydantic 2, asynchronous SQLAlchemy 2, asyncpg, Alembic, AuthX, bcrypt, Uvicorn.
- Services: PostgreSQL 16, Stripe Checkout/Webhooks, local or Cloudinary file storage.
- Operations: Docker, Docker Compose, Vercel-compatible SPA configuration, Render-compatible backend startup.

### Repository structure

```text
GrowCore/
├─ backend/
│  ├─ src/api/routers/       HTTP and WebSocket endpoints
│  ├─ src/api/services/      transactional domain/business logic
│  ├─ src/core/              settings, auth, database, dependencies, policies
│  ├─ src/models/            SQLAlchemy entities and relationships
│  ├─ src/schemas/           Pydantic request/response contracts
│  ├─ src/migrations/        Alembic migration history
│  ├─ src/utils/             seeds, receipts, Stripe/storage helpers
│  ├─ Dockerfile
│  └─ .env.example
├─ frontend/
│  ├─ src/api/               Axios clients and DTO normalization
│  ├─ src/components/        shared and feature UI components
│  ├─ src/context/           authentication context
│  ├─ src/hooks/             cart, favorites, catalog, pagination logic
│  ├─ src/layout/            application shells
│  ├─ src/pages/             route-level screens
│  ├─ src/routes/            route guards/loaders
│  ├─ src/utils/             formatting, receipts, product helpers
│  ├─ Dockerfile
│  └─ .env.example
├─ docker-compose.yml
├─ PROJECT_DOCUMENTATION.md
└─ README.md
```

### Local setup

Requirements for the Docker workflow: Docker Desktop with Compose. For direct development, use Python 3.12+, Node.js 20+, and PostgreSQL.

1. Create environment files:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

2. Replace placeholder database, JWT, storage, Stripe, seed, and category-secret values.

3. Start all services:

```powershell
docker compose up --build
```

Available endpoints:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Interactive OpenAPI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

The backend container waits for PostgreSQL, retries `alembic upgrade head` up to five times, starts Uvicorn, ensures the required roles, and optionally runs configured staff/catalog seeds. Frontend source and backend source are mounted for local development.

### Important environment variables

Backend secrets belong only in `backend/.env` or the hosting provider:

```env
DATABASE_URL=postgres://...
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3

JWT_SECRET=<long-random-secret>
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAMESITE=none

FILE_STORAGE_BACKEND=cloudinary
CLOUDINARY_URL=...
CLOUDINARY_FOLDER=growcore

STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur
STRIPE_AUTOMATIC_TAX=false
STRIPE_SHIPPING_ALLOWED_COUNTRIES=PT,ES,FR,DE,NL,BE,IT

FRONTEND_URL=https://your-frontend.example.com
ADDITIONAL_CORS_ORIGINS=
CATEGORY_MANAGEMENT_SECRET=<separate-random-secret>
```

Frontend configuration:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_WS_URL=wss://your-backend.example.com
```

`VITE_WS_URL` is required in production when HTTP `/api` requests go through a proxy without WebSocket upgrade support. Every `VITE_*` value is embedded into browser code and must never contain a password, private API key, or signing secret.

### Development checks

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

The repository currently has no automated unit/integration/end-to-end test suite. The complete REST API can be explored through `/docs`.

### Deployment outline

1. Provision PostgreSQL and deploy `backend/` on a Docker-compatible host.
2. Configure database pooling, JWT cookies, CORS, storage, Stripe, seed controls, and category secret.
3. Point the host health probe to `/health`; backend startup applies migrations automatically.
4. Deploy `frontend/` as a Vite SPA and route `/api/*` to the backend.
5. Set `VITE_WS_URL` to the direct backend WebSocket origin and rebuild after changing any `VITE_*` value.
6. Configure Stripe success/cancel URLs and the signed webhook endpoint `/orders/stripe/webhook`.

### Security and current maturity

The project includes role checks, bcrypt password hashing, CSRF-protected cookie JWT authentication, upload type/signature/size validation, private seller documents, transactional inventory checks, Stripe webhook validation and refunds, follow/chat throttling, CORS controls, and a separate category-management secret.

The unsafe client-confirmed payment and database-setup endpoints have been removed. Production configuration now rejects insecure cookies, weak JWT secrets, catalog demo seeds, and weak staff seed passwords. Keep both seed flags disabled after initial provisioning and configure the signed Stripe webhook before accepting payments. Guest cart/favorites are intentionally temporary in the current implementation.

For a page-by-page explanation, all status lifecycles, data model, file limits, order calculations, full API inventory, deployment details, and known limitations, read [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).

For the manual update, versioning, and release workflow, read [UPDATING_AND_RELEASES.md](UPDATING_AND_RELEASES.md).

---

## Русский

### О проекте

GrowCore — это не только интернет-витрина. Проект моделирует полный жизненный цикл маркетплейса: посетитель находит оборудование, покупатель собирает корзину и оплачивает заказ, кандидат подаёт заявку продавца, продавец создаёт магазин и товары, администратор проверяет участников и публикации, поддержка решает обращения, а пользователи подписываются друг на друга, добавляют друзей, переписываются и получают уведомления.

Репозиторий содержит одностраничный React frontend и асинхронный FastAPI backend с PostgreSQL. Бизнес-правила вынесены в сервисы, API-контракты описаны Pydantic-схемами, изменения базы выполняются Alembic, публичные и приватные файлы можно хранить локально или в Cloudinary, а вся среда разработки поднимается через Docker Compose.

### Основные возможности

- **Публичная часть:** главная, категории, глобальный поиск, карточки товаров и пользователей, страницы о проекте и доставке, адаптивная desktop/mobile навигация.
- **Каталог:** серверный поиск и фильтры по категории, продавцу, цене, наличию, меткам и динамическим характеристикам; сортировка и пагинация.
- **Товар:** галерея, скидка со сроком, выбор количества в пределах остатка, продавец и категория, структурированное описание, характеристики, рейтинг, отзывы с ответами и похожие позиции.
- **Аккаунт:** регистрация, JWT в cookies, автоматическое обновление сессии, public ID, профиль и avatar, роли и блокировка.
- **Покупки:** постоянные корзина и избранное для вошедшего пользователя, проверка склада, массовый перенос избранного и создание неоплаченного заказа.
- **Оплата и выполнение:** Stripe Checkout, webhook и redirect-подтверждение, платёжный документ, учёт комиссии/суммы продавца, доставка, tracking, история и возвраты.
- **Подключение продавца:** приватный подтверждающий документ, административная проверка, отклонение и повторная подача, автоматическое создание роли и магазина.
- **Кабинет продавца:** профиль магазина, черновики товаров, изображения, описание и атрибуты с неудаляемыми полями Brand и Warranty, скидки, склад, отправка на модерацию и управление публикацией.
- **Модерация:** статусы draft/pending/approved/rejected/blocked/deleted, просмотр материалов, решения с причиной и уведомления продавца.
- **Социальные функции:** поиск людей, подписки с защитой от частых действий, заявки в друзья с сообщением, принятие/отклонение, список друзей и публичные магазины.
- **Чат и уведомления:** REST-история, real-time WebSocket, краткоживущий ticket, ограничение частоты сообщений, группировка событий и счётчики.
- **Поддержка:** типизированные обращения, ответы, назначение сотруднику, статусы, поиск/фильтры и административная эскалация.
- **Администрирование:** поиск и сортировка товаров, заявок продавцов, пользователей, продавцов, транзакций Stripe, категорий и магазинов в фильтре, а также управление документами, доставкой и возвратами.

### Роли

| Роль | Основные права |
|---|---|
| Гость | Просмотр каталога, товаров, категорий, пользователей и информации; временные корзина/избранное |
| Пользователь | Постоянные покупки, оплата, заказы, отзывы, возвраты, профиль, подписки, друзья, чат, уведомления, поддержка |
| Продавец | Возможности пользователя плюс магазин и управление товарами |
| Поддержка | Работа с назначенными обращениями |
| Администратор | Модерация маркетплейса и все административные инструменты |

Роли дополняют друг друга: один аккаунт может иметь несколько ролей.

### Технологии

- Frontend: React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, TanStack Query, Ant Design, Lucide React.
- Backend: Python 3.12, FastAPI, Pydantic 2, асинхронный SQLAlchemy 2, asyncpg, Alembic, AuthX, bcrypt, Uvicorn.
- Сервисы: PostgreSQL 16, Stripe Checkout/Webhooks, локальное или Cloudinary-хранилище.
- Инфраструктура: Docker, Docker Compose, конфигурация SPA для Vercel и backend для Render-совместимого хостинга.

### Структура репозитория

```text
GrowCore/
├─ backend/
│  ├─ src/api/routers/       HTTP- и WebSocket-маршруты
│  ├─ src/api/services/      бизнес-логика и транзакции
│  ├─ src/core/              настройки, auth, БД, зависимости, политики
│  ├─ src/models/            SQLAlchemy-модели и связи
│  ├─ src/schemas/           Pydantic DTO запросов и ответов
│  ├─ src/migrations/        история миграций Alembic
│  ├─ src/utils/             seeds, чеки, Stripe/storage helpers
│  ├─ Dockerfile
│  └─ .env.example
├─ frontend/
│  ├─ src/api/               API-клиенты и нормализация данных
│  ├─ src/components/        общие и feature-компоненты
│  ├─ src/context/           контекст аутентификации
│  ├─ src/hooks/             корзина, избранное, каталог, пагинация
│  ├─ src/layout/            каркас приложения
│  ├─ src/pages/             страницы маршрутов
│  ├─ src/routes/            защита и загрузка маршрутов
│  ├─ src/utils/             форматирование, чеки, product helpers
│  ├─ Dockerfile
│  └─ .env.example
├─ docker-compose.yml
├─ PROJECT_DOCUMENTATION.md
└─ README.md
```

### Локальная установка

Для Docker-варианта нужен Docker Desktop с Compose. Для прямого запуска потребуются Python 3.12+, Node.js 20+ и PostgreSQL.

1. Создайте файлы окружения:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

2. Замените заглушки базы, JWT, хранилища, Stripe, seed-пользователей и секрета категорий.

3. Запустите сервисы:

```powershell
docker compose up --build
```

Адреса:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Интерактивный OpenAPI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

Backend-контейнер ожидает готовность PostgreSQL, до пяти раз пробует применить `alembic upgrade head`, запускает Uvicorn, создаёт необходимые роли и при включённых настройках выполняет staff/catalog seed. Исходники frontend и backend подключены как volumes для локальной разработки.

### Основные переменные окружения

Секреты backend должны находиться только в `backend/.env` или настройках хостинга:

```env
DATABASE_URL=postgres://...
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3

JWT_SECRET=<длинный-случайный-секрет>
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAMESITE=none

FILE_STORAGE_BACKEND=cloudinary
CLOUDINARY_URL=...
CLOUDINARY_FOLDER=growcore

STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur
STRIPE_AUTOMATIC_TAX=false
STRIPE_SHIPPING_ALLOWED_COUNTRIES=PT,ES,FR,DE,NL,BE,IT

FRONTEND_URL=https://your-frontend.example.com
ADDITIONAL_CORS_ORIGINS=
CATEGORY_MANAGEMENT_SECRET=<отдельный-случайный-секрет>
```

Настройки frontend:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_WS_URL=wss://your-backend.example.com
```

`VITE_WS_URL` обязателен в production, если HTTP `/api` проходит через proxy без поддержки WebSocket Upgrade. Все значения `VITE_*` встраиваются в браузерный bundle, поэтому в них нельзя помещать пароли, приватные API-ключи и signing secrets.

### Проверки при разработке

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

Автоматического набора unit/integration/e2e тестов в репозитории пока нет. Все REST-маршруты можно исследовать и запускать через `/docs`.

### Схема развёртывания

1. Создайте PostgreSQL и разверните `backend/` на Docker-совместимом хостинге.
2. Настройте подключение к БД, JWT cookies, CORS, storage, Stripe, seeds и секрет категорий.
3. Направьте health probe на `/health`; при старте backend сам применяет миграции.
4. Разверните `frontend/` как Vite SPA и перенаправьте `/api/*` на backend.
5. Укажите прямой backend WebSocket origin в `VITE_WS_URL`; после изменения `VITE_*` выполните новую сборку.
6. Настройте Stripe success/cancel URL и подписанный webhook `/orders/stripe/webhook`.

### Безопасность и зрелость проекта

В проекте уже есть ролевые проверки, bcrypt, JWT cookies, проверка MIME/сигнатуры/размера файлов, приватные документы продавцов, транзакционный контроль остатков, проверка Stripe webhook, ограничения частоты подписок/чата, CORS и отдельный секрет управления категориями.

Небезопасные endpoint самостоятельного подтверждения оплаты и настройки базы удалены. Cookie-аутентификация защищена CSRF-токеном, а одобрение возврата создаёт идемпотентный Stripe Refund. Production-конфигурация отклоняет небезопасные cookies, слабый JWT secret и demo catalog seed. После первичной настройки оставляйте оба seed-флага выключенными. Гостевые корзина и избранное в текущей версии намеренно существуют только до перезагрузки приложения.

Подробный рассказ о каждой странице и кнопке, жизненных циклах статусов, модели данных, лимитах файлов, расчёте заказа, полном API, deployment и известных ограничениях находится в [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).

Порядок обновления версий и создания новых релизов описан в [UPDATING_AND_RELEASES.md](UPDATING_AND_RELEASES.md).
