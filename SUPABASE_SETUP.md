# Supabase setup

This backend connects to Supabase as a normal PostgreSQL database through
SQLAlchemy and `asyncpg`.

## Recommended connection

For a hosted backend on an IPv4-only network, use the Supabase Shared Pooler in
Session mode:

```env
DATABASE_URL=postgres://postgres.<project-ref>:<database-password>@aws-<region>.pooler.supabase.com:5432/postgres
```

The app automatically converts `postgres://` or `postgresql://` to the asyncpg
driver URL required by SQLAlchemy.

If you prefer separate variables instead of `DATABASE_URL`, use:

```env
POSTGRES_USER=postgres.<project-ref>
POSTGRES_PASSWORD=<database-password>
POSTGRES_HOST=aws-<region>.pooler.supabase.com
POSTGRES_PORT=5432
POSTGRES_DB=postgres
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3
```

Do not set both approaches unless they point to the same database.
`DATABASE_URL` takes priority.

## How to get the values

1. Open your Supabase project.
2. Click `Connect` in the project dashboard.
3. Choose `Connection Pooler`.
4. Choose `Session` mode.
5. Copy the connection string and replace `[YOUR-PASSWORD]` with your database
   password.
6. Put the result into `backend/.env` as `DATABASE_URL`.

For local development, copy `backend/.env.example` to `backend/.env` and fill in
the values.

## Run migrations

From the backend directory:

```powershell
alembic upgrade head
```

Or, if you use the project virtual environment from the repository root:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

## Notes

- Session pooler uses port `5432`.
- Transaction pooler uses port `6543`, but it disables prepared statements and
  is mainly for serverless or short-lived functions.
- Direct database connections use `db.<project-ref>.supabase.co:5432`, but free
  Supabase projects expose that endpoint over IPv6. Use Session pooler if your
  deployment platform is IPv4-only.
