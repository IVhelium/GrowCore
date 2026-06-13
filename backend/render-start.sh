#!/bin/sh
set -e

max_attempts="${MIGRATION_MAX_ATTEMPTS:-5}"
attempt=1

while [ "$attempt" -le "$max_attempts" ]; do
  echo "Running database migrations, attempt $attempt/$max_attempts..."

  if python -m alembic upgrade head; then
    echo "Database migrations completed."
    break
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "Database migrations failed after $max_attempts attempts."
    exit 1
  fi

  echo "Database is not ready yet, retrying migrations in 5 seconds..."
  attempt=$((attempt + 1))
  sleep 5
done

echo "Starting Uvicorn on port ${PORT:-8000}..."
exec python -m uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
