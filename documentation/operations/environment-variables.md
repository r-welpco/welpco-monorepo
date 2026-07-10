# Environment Variables

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Every variable below was verified against actual code reads (`ConfigService.get(...)` / `process.env.*` greps), not just `.env.example` contents. Copy each app's `.env.example` to `.env` (BFF also reads `.env.local`, which wins).

**Known error in root `.env.example`:** it documents `WEB_PORT=8080`, but the web app actually runs on **8081** (`apps/web/package.json`: `next dev -p 8081` / `next start -p 8081`). Admin is 8082, BFF defaults to 3000. Ignore `WEB_PORT` — no code reads it; ports are hardcoded in the Next.js scripts.

## BFF (`apps/bff`) — source: `apps/bff/.env.example`

### Database

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `DB_HOST` | prod: yes (dev default `localhost`) | Postgres host | `src/database/database.module.ts`, `src/database/db-cli-options.ts` |
| `DB_PORT` | no (default `5432`) | Postgres port | same |
| `DB_USERNAME` | no (default `welpco`) | Postgres user | same |
| `DB_PASSWORD` | prod: yes (dev default `welpco_dev`) | Postgres password | same |
| `DB_DATABASE` | no (default `welpco_dev`) | Database name; also feeds the seed "production-like" guard (`/prod/i`) | same + `seeds/seed-flags.ts` |
| `DB_SSL` / `PGSSLMODE` / `DB_SSL_REJECT_UNAUTHORIZED` | no | SSL control; SSL auto-on when `NODE_ENV=production` | `db-cli-options.ts` (`postgresSslOption`) |
| `DB_LOGGING` | no | `true` = SQL logging in the migration runner | `src/database/run-migrations.ts` |

### Auth

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `JWT_SECRET` | yes | Access-token signing | `src/common/auth/jwt-module-options.factory.ts`, auth service |
| `JWT_EXPIRES_IN` | yes (e.g. `15m`) | Access-token TTL | same |
| `JWT_REFRESH_SECRET` | yes | Refresh-token signing | same |
| `JWT_REFRESH_EXPIRES_IN` | yes (e.g. `7d`) | Refresh-token TTL | same |

### Networking / URLs

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `PORT` | no (default `3000`) | BFF listen port | `src/main.ts` |
| `CORS_ORIGINS` | prod: yes | Comma-separated allowed origins (dev auto-allows localhost 3000/8080/8081/8082) | `src/main.ts` |
| `FRONTEND_URL` | no (dev fallback localhost) | Links in emails, Stripe Connect return URLs, review links | `src/main.ts`, email/notification services, `payment/stripe-connect.service.ts` |
| `PUBLIC_APP_URL` | no (falls back to `FRONTEND_URL`) | Public URL for email assets | email services |

### Stripe

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | for any payments | All Stripe calls (payments, Connect, transfers, Tax); services no-op or 400 without it; `sk_live_` prefix flips dashboard URLs to live | `payment/*` services, `safety-verification/background-check-payment.service.ts` |
| `STRIPE_WEBHOOK_SECRET` | for webhooks | Webhook signature verification | `payment/stripe-webhook.controller.ts` |
| `STRIPE_BOOKING_TAX_CODE` | no | Tax code override for bookings | `payment/booking-tax.service.ts` |

### Email

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `RESEND_API_KEY` | prod: this or SMTP | Resend HTTP email (primary) | `email.service.ts` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` (or `SMTP_PASSWORD`) | fallback | SMTP transport (MailHog in dev: 1025) | `email.service.ts` |
| `SMTP_FROM` | no (default `noreply@welpco.com`) | Sender address | `email.service.ts` |

### AWS S3 (uploads) — **not in any .env.example; app throws without them**

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `AWS_S3_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | **yes** (`getOrThrow`) | Uploads + presigned URLs | `src/modules/uploads/uploads.service.ts`, `s3-url-presigner.service.ts` |
| `S3_BUCKET_EVIDENCE`, `S3_REGION`, `S3_PRESIGN_TTL_SECONDS` | no | Legacy fallbacks / presign TTL | `s3-url-presigner.service.ts` |

### Third-party services

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | yes at startup (placeholder ok in dev) | Geocoding | `src/geocode/google-maps-geocode.service.ts` |
| `TURNSTILE_SECRET_KEY` | prod: yes | Cloudflare Turnstile server verification | `src/common/human-verification/human-verification.service.ts` |
| `CERTN_API_ENABLED` | no (default false = manual flow) | Toggle Certn background-check API | `safety-verification/background-check.service.ts` |
| `CERTN_API_KEY`, `CERTN_API_BASE_URL`, `CERTN_WEBHOOK_SECRET`, `CERTN_IDENTITY_CHECK_MODE` | if Certn enabled | Certn API client + webhook | `safety-verification/certn-api.client.ts`, `certn-webhook.controller.ts` |
| `BACKGROUND_CHECK_APPLICANT_URL` (+ `_FR`) | if Certn disabled | Manual screening links (EN/FR) | `background-check.service.ts` |

### Feature flags

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `PLATFORM_ACCESS_GATED` | no (default gated) | Launch gate blocking `/dashboard` | `src/common/platform-access.ts` |
| `NODE_ENV` | yes | Env detection (SSL, rate limits, E2E Stripe bypass, seed guards) | throughout |

## Web (`apps/web`) — source: `apps/web/.env.example` · runs on port **8081**

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `NEXTAUTH_SECRET` (alias `AUTH_SECRET`) | **yes** | Session signing | `auth.ts` |
| `NEXTAUTH_URL` (alias `AUTH_URL`) | prod: yes | Canonical URL when auto-detect fails | `auth.ts` |
| `NEXT_PUBLIC_API_URL` | yes | BFF base URL | `next.config.ts`, `auth.ts`, API client/components |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | for payments | Stripe.js | booking page, `components/features/payments/add-payment-method-shared.tsx` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | prod: yes | Turnstile widget / server check | auth pages, `lib/security/human-verification.ts` |
| `CONTACT_INBOX` | no (default `support@welpco.com`) | Contact form recipient | `app/api/contact/route.ts` |
| `PUBLIC_APP_URL` | no | Email asset URL for contact route | `app/api/contact/route.ts` |
| `NEXT_PUBLIC_SITE_URL` | no (default `https://welpco.com`) | robots/sitemap/canonical | `app/robots.ts`, `app/sitemap.ts`, `app/layout.tsx` |
| `NEXT_PUBLIC_ZOHO_SALESIQ_ENABLED` / `_WIDGET_CODE` / `_SCRIPT_SRC` | no | Zoho SalesIQ chat | `next.config.ts`, layout |
| `NEXT_PUBLIC_PLATFORM_ACCESS_GATED` | no | Client mirror of BFF launch gate | gated UI |
| `NEXT_PUBLIC_DEFAULT_COUNTRY_CODE` | no | Search default country | `app/(dashboard)/dashboard/search/page-client.tsx` |
| `NEXT_PUBLIC_ENABLE_SW_IN_DEV` | no | Enable PWA service worker in dev | `components/providers/pwa-service-worker.tsx` |
| `ENABLE_DEV_AUTH_FALLBACK` | no (dev only) | Auth fallback when BFF is down | documented in `.env.example` |

## Admin (`apps/admin`) — source: `apps/admin/.env.example` · runs on port **8082**

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `NEXTAUTH_SECRET` (alias `AUTH_SECRET`) | **yes** | Session signing | `auth.ts` |
| `NEXTAUTH_URL` (alias `AUTH_URL`) | yes (fallback `http://localhost:8082`) | Canonical admin URL | `auth.ts` |
| `NEXT_PUBLIC_API_URL` | yes | BFF base URL (incl. payout CSV export link) | `lib/api/client.ts`, `lib/auth/*`, `app/(dashboard)/payouts/[batchId]/payout-batch-export-client.tsx` |
| `NEXT_PUBLIC_ADMIN_MAP_TILE_URL` / `NEXT_PUBLIC_ADMIN_MAP_ATTRIBUTION` | no | Map tiles for welper-distribution report | `app/(dashboard)/reports/welper-distribution/welper-distribution-map.tsx` |

## Root — source: `/.env.example` (docker-compose only)

| Variable | Required | Purpose | Where used |
|---|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_HOST` / `POSTGRES_PORT` | no (compose has defaults `welpco`/`welpco_dev`/`welpco_dev`) | Local Postgres container | `docker-compose.yml` |
| `WEB_PORT` | — | **Stale: says 8080, real port is 8081.** Not read by any code | root `.env.example` only |
| `DATABASE_URL`, `API_VERSION`, `LOG_LEVEL`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `CORS_ORIGIN` | no | Listed in root `.env.example` but **no code reads them** (BFF uses discrete `DB_*` vars and `CORS_ORIGINS` — plural) | — |

`turbo.json` declares the NextAuth/Zoho/`NEXT_PUBLIC_*` vars as build inputs for cache correctness (`@welpco/web#build` env list) — set them at build time, not only at runtime.

## Seed / dev-only variables

Not for production configuration. See `documentation/operations/seeds.md` for the seed flags in context.

| Variable | Purpose | Where used |
|---|---|---|
| `DISABLE_RATE_LIMIT` | Turn off BFF rate limiting for local/E2E runs | `apps/bff/src/domains/user-management/auth/guards/rate-limit.guard.ts` |
| `SEED_SKIP_USERS`, `SEED_CONFIRM_PRODUCTION`, `SEED_ENV` | Seed safety guards (content-only mode, prod confirmation) | `apps/bff/src/database/seeds/seed-flags.ts`, `run-seed.ts` |
| `CLEAR_CONTENT` | `1` = wipe and reseed CMS content | `seeds/seed-content.ts` |
| `REPLACE_SERVICE_QUESTIONS`, `SKIP_TAXONOMY_SYNC` | Options for the service-questions seed | `seeds/run-seed-service-selection-questions.ts` |
| `SEARCH_CATEGORY_ID`, `EXPECTED_WELPER_EMAIL`, `BFF_URL` | Inputs for the search demo smoke test | `apps/bff/src/scripts/search-welper-demo-test.ts` |
| `PLAYWRIGHT_TEST_BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `PROXY_DEBUG` | Web E2E/dev debugging | `apps/web/playwright.config.ts`, `apps/web/proxy.ts` |
| `RUN_DISPUTE_E2E` | Enables the dispute E2E suite | `apps/bff/package.json` (`test:e2e:dispute`) |
