# Changelog

## Unreleased

Place user-visible changes for the next version here while developing.

## 0.1.0 - 2026-06-21

- Added CSRF protection for cookie-authenticated state-changing requests.
- Removed unauthenticated database setup and client-confirmed payment endpoints.
- Added Stripe refunds when an administrator approves a return.
- Added fail-fast production validation for secrets, secure cookies, and seed settings.
- Disabled production staff/catalog seeds in the example configuration.
- Updated frontend and backend dependencies to versions without known audit findings.
- Fixed Docker builds failing when local Python cache directories are inaccessible.
- Aligned notification/review model metadata with existing database indexes and column sizes.
- Verified frontend lint/build, Python compilation, Compose configuration, and Alembic history.
