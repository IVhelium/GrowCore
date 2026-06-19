# GrowCore

[English](#english) · [Русский](#русский)

## English

### Overview

GrowCore is a full-stack marketplace for garden automation and greenhouse equipment. It provides a product catalog, backend filtering, carts, favorites, Stripe Checkout, orders and returns, user chat, grouped notifications, seller tools, moderation, support tickets, and administration.

### Technology

- Frontend: React 19, Vite, React Router, Tailwind CSS, Axios, Lucide React.
- Backend: FastAPI, async SQLAlchemy, Pydantic, Alembic, PostgreSQL.
- Services: Docker Compose, Cloudinary-compatible storage, Stripe Checkout.

### Repository

```text
backend/src/
  api/routers/       HTTP and WebSocket endpoints
  api/services/      business logic by domain
  models/            SQLAlchemy models
  schemas/           Pydantic DTOs
  migrations/        Alembic migrations
frontend/src/
  api/               API clients and data normalization
  components/        shared and feature components
  hooks/             reusable state and data logic
  pages/             route composition
  layout/            application shell
```

### Local start

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then fill in local values.

```powershell
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`

The backend container applies migrations automatically. Manual checks:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

### Configuration

Backend secrets belong only in `backend/.env` or the hosting provider:

```env
DATABASE_URL=postgres://...
JWT_SECRET=<long-random-secret>
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
CATEGORY_MANAGEMENT_SECRET=<separate-random-secret>
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend configuration:

```env
VITE_API_URL=/api
VITE_WS_URL=wss://your-backend.example.com
```

`VITE_WS_URL` is required in production when `/api` is routed through Vercel. Vercel HTTP rewrites do not proxy WebSocket upgrades, so chat connects directly to the backend and authenticates using a short-lived ticket obtained through the authenticated API.

Variables prefixed with `VITE_` are compiled into browser code. They must never contain passwords or secret keys. A backend URL is configuration, not a secret, and remains visible in browser DevTools even when supplied through a private Vercel setting.

### Deployment

1. Deploy `backend/` to a Docker-compatible host and configure `/health`.
2. Provide PostgreSQL, JWT, Cloudinary, Stripe, CORS, and category-management values on the backend host.
3. Deploy `frontend/` as a Vite application.
4. Set `VITE_API_URL=/api` and `VITE_WS_URL=wss://<backend-host>` in Vercel.
5. Redeploy Vercel after changing any `VITE_*` variable; these values are applied at build time.

Normal Render WebSocket output is `WebSocket /users/ws/chats [accepted]`. Repeated `GET /users/ws/chats 404` means the frontend is still routing WebSockets through an HTTP-only proxy or is running an old build.

### Security notes

- Never commit `.env` files, JWT secrets, Stripe keys, webhook secrets, Cloudinary credentials, or the category-management secret.
- Stripe Checkout Session IDs beginning with `cs_` are identifiers, not credentials, but should remain in authenticated administration pages.
- Use Stripe test mode before enabling live payments.
- Rotate any credential exposed in source control, public logs, or an untrusted message.

## Русский

### О проекте

GrowCore — полнофункциональный маркетплейс оборудования для автоматизации сада и теплиц. В проект входят каталог с серверными фильтрами, корзина, избранное, Stripe Checkout, заказы и возвраты, чат, группируемые уведомления, инструменты продавца, модерация, поддержка и административная панель.

### Технологии

- Frontend: React 19, Vite, React Router, Tailwind CSS, Axios, Lucide React.
- Backend: FastAPI, асинхронный SQLAlchemy, Pydantic, Alembic, PostgreSQL.
- Инфраструктура: Docker Compose, Cloudinary-совместимое хранилище и Stripe Checkout.

### Структура репозитория

```text
backend/src/
  api/routers/       HTTP- и WebSocket-маршруты
  api/services/      бизнес-логика по предметным областям
  models/            модели SQLAlchemy
  schemas/           DTO Pydantic
  migrations/        миграции Alembic
frontend/src/
  api/               API-клиенты и нормализация данных
  components/        общие и предметные компоненты
  hooks/             переиспользуемая логика состояния
  pages/             композиция страниц
  layout/            каркас приложения
```

### Локальный запуск

Скопируйте `backend/.env.example` в `backend/.env`, а `frontend/.env.example` — в `frontend/.env`. После заполнения локальных значений выполните:

```powershell
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`

Backend-контейнер автоматически применяет миграции. Ручная проверка:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

### Переменные окружения

Секреты backend должны находиться только в `backend/.env` или настройках хостинга:

```env
DATABASE_URL=postgres://...
JWT_SECRET=<длинный-случайный-секрет>
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
CATEGORY_MANAGEMENT_SECRET=<отдельный-случайный-секрет>
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Настройки frontend:

```env
VITE_API_URL=/api
VITE_WS_URL=wss://your-backend.example.com
```

`VITE_WS_URL` обязателен в production, если `/api` проксируется через Vercel. Обычные HTTP rewrite-правила Vercel не поддерживают WebSocket Upgrade, поэтому чат подключается напрямую к backend и авторизуется короткоживущим ticket, полученным через обычный API.

Переменные с префиксом `VITE_` встраиваются в JavaScript браузера. В них нельзя хранить пароли и секретные ключи. URL backend не является секретом и в любом случае виден в DevTools, даже если значение задано как приватная переменная Vercel.

### Развертывание

1. Разверните `backend/` на Docker-совместимом хостинге и настройте проверку `/health`.
2. Добавьте на backend-хостинге PostgreSQL, JWT, Cloudinary, Stripe, CORS и секрет управления категориями.
3. Разверните `frontend/` как Vite-приложение.
4. Укажите в Vercel `VITE_API_URL=/api` и `VITE_WS_URL=wss://<backend-host>`.
5. После изменения любой `VITE_*` переменной обязательно создайте новый deployment Vercel — значения подставляются во время сборки.

Нормальная запись Render: `WebSocket /users/ws/chats [accepted]`. Повторяющийся `GET /users/ws/chats 404` означает, что frontend всё ещё отправляет WebSocket через HTTP-прокси или использует старую сборку.

### Безопасность

- Не добавляйте в Git `.env`, JWT-секреты, Stripe-ключи, webhook-секреты, Cloudinary credentials и секрет управления категориями.
- Stripe Checkout Session ID с префиксом `cs_` — идентификатор, а не ключ доступа, но его следует показывать только в авторизованной админ-панели.
- Перед live-платежами используйте тестовый режим Stripe.
- Любые опубликованные секреты необходимо немедленно заменить.
