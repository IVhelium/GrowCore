# Changelog

## Unreleased

## 0.1.0 - 2026-06-24

- Added tab-specific sorting across the entire administration panel, including products, transactions, seller requests, users, sellers, categories, and seller filter options.
- Added category search to the administration panel.
- Prevented the required Brand and Warranty product attributes from being removed in create and edit forms.
- Hid the visual horizontal scrollbar on pagination while preserving touch and horizontal scrolling on narrow screens.
- Added CSRF protection for cookie-authenticated state-changing requests.
- Removed unauthenticated database setup and client-confirmed payment endpoints.
- Added Stripe refunds when an administrator approves a return.
- Added fail-fast production validation for secrets, secure cookies, and seed settings.
- Disabled production staff/catalog seeds in the example configuration.
- Updated frontend and backend dependencies to versions without known audit findings.
- Fixed Docker builds failing when local Python cache directories are inaccessible.
- Aligned notification/review model metadata with existing database indexes and column sizes.
- Verified frontend lint/build, Python compilation, Compose configuration, and Alembic history.
