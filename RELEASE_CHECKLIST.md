# GrowCore 0.1.3 release checklist

Planned release date: 2026-07-04

- [ ] Merge the intended `dev` changes into `main` and review the final diff.
- [ ] Set `ENV=production` and generate a unique JWT secret of at least 32 characters.
- [ ] Keep `JWT_COOKIE_SECURE=true`, `JWT_COOKIE_CSRF_PROTECT=true`, and both seed flags false.
- [ ] Set the exact frontend origin in `FRONTEND_URL`; do not use a wildcard with credentials.
- [ ] Configure PostgreSQL, Cloudinary, Stripe secret key, and signed webhook secret.
- [ ] Point Stripe webhooks to `POST /orders/stripe/webhook`.
- [ ] Configure `VITE_API_URL` and `VITE_WS_URL`, then rebuild the frontend.
- [ ] Apply `alembic upgrade head` against the production database.
- [ ] Run `alembic check` against a production-like database; no upgrade operations may be pending.
- [ ] Verify `/health`, registration/login/logout, catalog, cart, Stripe checkout/webhook, failed-payment retry, and an admin refund.
- [ ] Smoke-test admin sections, seller document review, review deletion as author/admin, long rejection/return reasons, and order search/sort/status tabs with pagination.
- [ ] Confirm `RUN_STAFF_SEED=false` and `RUN_CATALOG_SEED=false` after provisioning.
- [ ] Create GitHub release `v0.1.3` from the merged `main` commit only after the production smoke check passes.
