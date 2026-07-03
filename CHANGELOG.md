# Changelog

## Unreleased

## 0.1.2 - 2026-07-03

- Added styled confirmation and reason dialogs across the app, replacing native browser prompts.
- Added review and reply deletion for authors and administrators, with product rating recalculation.
- Improved long-text wrapping across layouts so saved reasons, comments, addresses, and notices do not break cards.
- Clarified the seller application document upload area and updated placeholders with Portugal-focused examples.
- Completed the return workflow with administrator approve/reject actions, Stripe refunds, notifications, and stock restoration after approved returns.
- Split the admin panel into shared building blocks and dedicated section modules for users, sellers, transactions, categories, and seller-filter controls.
- Prepared frontend and backend version metadata for the 0.1.2 release.

## 0.1.1 - 2026-06-27

- Added seller product media improvements: multiple selected images now remain as local draft previews while sellers add more files before saving or submitting.
- Added product image fallback UI with a file icon for missing or broken non-avatar images across the storefront, cart, orders, seller workspace, and administration views.
- Added product detail carousel controls for multi-image products.
- Changed product detail descriptions to render structured sections, with Characteristics displayed as vertical rows instead of inline text.
- Changed the product detail summary beside the price to show only the manufacturer Overview with a four-line clamp.
- Improved the product detail thumbnail carousel so previews stay in one adaptive horizontal row with overflow scrolling.
- Added a service top bar with delivery, returns, payments, orders, support, and seller links.
- Added a global back-to-top button with a simple fade-in state.
- Tightened seller product form validation for discount limits, discount expiry dates, required sections, Brand, Warranty, and visible top-of-form errors.
- Simplified seller edit actions so draft/rejected products show separate draft and submit actions, while other statuses show one save action.

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
