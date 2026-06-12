# Render Free backend + Vercel frontend

Deploy only the backend to Render Free. Deploy the frontend to Vercel.
Do not use a Render Blueprint YAML file.

## 1. Database

Use Supabase as the external PostgreSQL database. Migrations are already
compatible with the Supabase Session pooler.

Recommended backend database variable:

```env
DATABASE_URL=postgres://postgres.<project-ref>:<database-password>@aws-<region>.pooler.supabase.com:5432/postgres
```

## 2. Backend service

Create a new Render `Web Service`.

Settings:

```text
Runtime: Docker
Root Directory: backend
Dockerfile Path: Dockerfile
Health Check Path: /health
Instance Type: Free
```

The backend Dockerfile runs `/app/entrypoint.sh`, which applies Alembic
migrations and then starts Uvicorn on Render's `PORT`.

Environment variables:

```env
ENV=production
DATABASE_URL=
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3

JWT_SECRET=
JWT_ACCESS_COOKIE_NAME=access_token
JWT_REFRESH_COOKIE_NAME=refresh_token
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAMESITE=none

FRONTEND_URL=https://your-frontend.vercel.app
ADDITIONAL_CORS_ORIGINS=

FILE_STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=growcore

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=eur

RUN_STAFF_SEED=true
RUN_CATALOG_SEED=true
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_SUPPORT_USERNAME=support
SEED_SUPPORT_EMAIL=
SEED_SUPPORT_PASSWORD=
UPDATE_SEEDED_USERS_PASSWORDS=false
```

Leave Stripe values empty if payments are not needed yet.

## 3. Vercel frontend

Create a Vercel project from the same repository.

Settings:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com
```

The existing `frontend/vercel.json` already rewrites all frontend routes to
`/index.html`, so React Router routes can be refreshed directly.

After the Vercel deploy finishes, copy the frontend URL into the Render backend
`FRONTEND_URL` variable and redeploy the backend.

## 4. CORS

If you add another frontend URL, custom domain, or Vercel preview domain, add it
to backend `ADDITIONAL_CORS_ORIGINS`:

```env
ADDITIONAL_CORS_ORIGINS=https://www.example.com,https://your-preview.vercel.app
```

Origins must not include a trailing slash.

## 5. Cookie auth note

Because the frontend and backend are on different domains, keep:

```env
JWT_COOKIE_SECURE=true
JWT_COOKIE_SAMESITE=none
```

Vercel must call the backend through the exact URL in `VITE_API_URL`.
