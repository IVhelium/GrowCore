#!/bin/sh
set -e

until alembic upgrade head; do
  echo "Database is not ready yet, retrying migrations in 2 seconds..."
  sleep 2
done

exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
