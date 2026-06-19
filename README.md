# GrowCore

GrowCore is a full-stack marketplace for garden automation and greenhouse equipment. It includes a public catalog, backend-powered filters, carts, favorites, Stripe Checkout, orders and returns, user chat, grouped notifications, seller workflows, moderation, support tickets, and administration tools.

## Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Axios, Lucide React.
- Backend: FastAPI, SQLAlchemy async ORM, Pydantic, Alembic, PostgreSQL.
- Infrastructure: Docker Compose, Cloudinary-compatible storage, Stripe Checkout.

## Structure

```text
backend/src/
  api/routers/       HTTP and WebSocket endpoints
  api/services/      domain services
  models/            SQLAlchemy models
  schemas/           API DTOs
  migrations/        Alembic migrations
frontend/src/
  api/               API clients and normalizers
  components/        reusable and feature UI
  hooks/             state and data hooks
  pages/             route composition
  layout/            application shell
```

Large route pages should only coordinate data and actions. Feature-specific presentation belongs under `frontend/src/components/<feature>/`; backend behavior belongs in the corresponding domain service instead of routers.

## Local development

Copy the example environment files, fill in secrets, then run:

```powershell
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- OpenAPI: http://localhost:8000/docs

The backend entrypoint applies Alembic migrations automatically. Manual commands:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

## Required backend configuration

See `backend/.env.example` for the complete list. Never commit real values.

```env
DATABASE_URL=postgres://...
JWT_SECRET=<long-random-secret>
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
FRONTEND_URL=http://localhost:5173
CATEGORY_MANAGEMENT_SECRET=<separate-long-random-secret>
```

Category creation, editing, ordering, and deletion require `CATEGORY_MANAGEMENT_SECRET`, including for administrators.

## Storage and payments

Cloudinary can be configured through `CLOUDINARY_URL` or the separate cloud name, key, and secret variables. Stripe requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; only signed webhook events finalize payments. Values beginning with `sk_` and `whsec_` are secrets. Checkout Session IDs beginning with `cs_` are identifiers, not credentials, but should still remain inside authenticated interfaces.

## Production deployment

- Backend: deploy `backend/` as a Docker service, use `/health`, and provide PostgreSQL, JWT, storage, Stripe, CORS, and seed variables.
- Frontend: deploy `frontend/` as a Vite application and route `/api` to the backend.
- Configure `VITE_WS_URL=wss://<backend-host>` so chat WebSockets connect directly to the backend; serverless HTTP rewrites such as Vercel `/api` do not proxy WebSocket upgrades.
- Cross-site cookie deployments require HTTPS, `JWT_COOKIE_SECURE=true`, and an appropriate `JWT_COOKIE_SAMESITE` value.
- Use a persistent PostgreSQL database and Cloudinary in environments without persistent disks.

## Current behavior notes

- Product filtering and sorting run on the backend.
- Admins choose which stores appear explicitly in seller filters; all remaining stores are grouped under “Other”.
- Notifications with the same group key are combined within a short window.
- Chat sends are rate-limited on both client and server.
- Support tickets in resolved/closed queues are read-only.

## Security

- Keep `.env` files, JWT secrets, category management secrets, Stripe secret keys, webhook secrets, and Cloudinary credentials private.
- Use test Stripe credentials before enabling live payments.
- Rotate any credential that has been committed, logged publicly, or sent to an untrusted recipient.
