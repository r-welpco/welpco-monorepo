# Backend Overview — BFF (`apps/bff`)

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

The BFF is a single NestJS application (Express platform) that serves every Welpco client (web app, admin app). Despite the Swagger description text mentioning microservices, it is a monolith: one process, one PostgreSQL database, all domain logic in-process.

## Bootstrap (`apps/bff/src/main.ts`)

| Concern | Implementation |
|---|---|
| Global prefix | `api` (all routes are `/api/...`) |
| Port | `PORT` env var, default `3000` |
| Validation | Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform` |
| Errors / logging | Global `HttpExceptionFilter` (`src/common/filters/`) and `LoggingInterceptor` (`src/common/interceptors/`) |
| Security headers | `helmet` with CSP disabled (API-only; CSP enforced by the Next.js frontends), HSTS 2 years, `crossOriginResourcePolicy: cross-origin` |
| CORS | Credentialed allowlist from `CORS_ORIGINS` (comma-separated) or `FRONTEND_URL`; in dev defaults to `localhost`/`127.0.0.1` ports 8080–8082 and 3000 |
| Body parsing | Registered via Nest's `useBodyParser` (1 MB limit) so `req.rawBody` is populated — required for Stripe webhook signature verification (`NestFactory.create(..., { rawBody: true })`) |
| Swagger | `/api/docs` — **non-production only** (`SwaggerModule.setup` is skipped when `NODE_ENV === 'production'`). Bearer auth scheme named `JWT-auth`, persisted authorization |
| Static assets | `public/` served for favicons |
| Health check | `GET /api/health` (`src/health/health.controller.ts`) |

## Module layout (`apps/bff/src/app.module.ts`)

- `ConfigModule.forRoot({ isGlobal: true })` loading `.env.local` then `.env` from the package root.
- `ScheduleModule.forRoot()` for cron jobs (see [Scheduled jobs](#scheduled-jobs)).
- `DatabaseModule`, `S3Module` (`src/clients/s3` — S3 presigning), `DiscoveryCategoriesCacheModule`, `HealthModule`.
- 13 domain modules under `src/domains/` (below).
- Thin API modules under `src/modules/` (`auth`, `users`, `profiles`, `content`, `notifications`, `uploads`) — controllers/services that compose the domain modules (e.g. `modules/auth/auth.module.ts` imports the user-management and profile-management domain modules).

## Domain modules (`src/domains/`)

All 13 domains, each a self-contained NestJS module with its own `entities/`, `dto/`, and `migrations/` folders:

| Domain | Module file |
|---|---|
| booking | `src/domains/booking/booking.module.ts` |
| communication | `src/domains/communication/` (chat threads, messages) |
| content-management | `src/domains/content-management/` (service categories, questions, static content, FAQ, holidays, marketing phrases) |
| dispute | `src/domains/dispute/` (disputes, resolutions, support tickets) |
| geocode | `src/domains/geocode/` (address geocoding) |
| job-posting | `src/domains/job-posting/` (job postings, applications) |
| notification | `src/domains/notification/` (in-app notifications, preferences, email dispatch) |
| payment | `src/domains/payment/` (Stripe payments, tax, refunds, welper payouts) |
| profile-management | `src/domains/profile-management/` (customer/welper profiles, offerings, availability, favorites) |
| review | `src/domains/review/` (booking reviews) |
| safety-verification | `src/domains/safety-verification/` (background checks, minor guardian consent) |
| service-discovery | `src/domains/service-discovery/` (welper search) |
| user-management | `src/domains/user-management/` (accounts, auth, referrals, email verification, admin) |

Per-domain docs: [domains/README.md](domains/README.md).

## `src/common/`

- **`auth/`** — the authentication/authorization toolkit:
  - `strategies/jwt.strategy.ts` — Passport JWT strategy (`Authorization: Bearer`, secret from `JWT_SECRET`, expiration enforced). `validate()` re-reads the `UserAccount` on **every request**: rejects missing accounts, `SUSPENDED`/`DEACTIVATED` status, the retired `GUARDIAN` account type, non-active admins, and stale tokens via an `authVersion` mismatch check (token invalidation on password change etc.).
  - `guards/jwt-auth.guard.ts` — extends `AuthGuard('jwt')`; honors the `@Public()` decorator (`isPublic` metadata) to skip auth.
  - `guards/roles.guard.ts` — matches `@Roles(...)` metadata against the user's effective role (`effective-role.util.ts` derives it from `accountType`); case-insensitive.
  - `guards/signup-completed.guard.ts` — requires `signupCompleted === true` (admins bypass); returns 403 with code `SIGNUP_COMPLETION_REQUIRED`.
  - `decorators/` — `@CurrentUser()` (request user → `CurrentUserData`), `@Public()`, `@Roles()`.
- **`guards/email-verified.guard.ts`** — gates "bookable actions" (booking creation, payment ops) on the user having verified their email; 403 with a structured body.
- **`base-entity.ts`** — re-exports `BaseEntity` from `@welpco/database` (`packages/database/src/base-entity.ts`): UUID primary key + `created_at` / `updated_at` timestamp columns. Every domain entity extends it.
- Also: `filters/` (HTTP exception filter), `interceptors/` (logging), `dto/`, `http/`, `human-verification/`, `discovery-categories-cache/`, `constants/`, `types/`, `preferred-locale.ts`, `signup-e2e-bypass.ts` (E2E Stripe bypass prefix), `display-name.util.ts`.

## Database

- **ORM: TypeORM** (`@nestjs/typeorm`), **PostgreSQL**. One database for all domains — `src/database/database.module.ts` is explicit: "Single database module for the BFF. One PostgreSQL database (welpco_dev) for all domains."
- Connection config from `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` (dev defaults `localhost` / `welpco` / `welpco_dev`); production fails fast if host/password unset. Pool: max 20 prod / 5 dev, 30 s statement timeout.
- `synchronize: false` always — schema changes go through migrations only.
- **All entities are registered centrally** in the `allEntities` array in `database.module.ts` (39 entities at this commit); `TypeOrmModule.forFeature(allEntities)` is exported so any module importing `DatabaseModule` can inject any repository.
- **Migrations** live per-domain in `src/domains/<domain>/migrations/` plus cross-domain ones in `src/database/migrations/`. The runner `src/database/run-migrations.ts` **auto-discovers** them with a filesystem glob (`src/**/migrations/*-*.{ts,js}`), sorts by timestamp prefix, and applies pending ones in order with per-migration transactions (`migrationsTransactionMode: 'each'`). It errors loudly if the glob matches zero files. Seeds live in `src/database/seeds/`.

## Caching

In-memory only — there is no Redis or distributed cache. The one dedicated cache is `DiscoveryCategoriesCacheService` (`src/common/discovery-categories-cache/`): a process-local 5-minute-TTL cache of active service categories used by service-discovery search, invalidated when `CategoriesService` mutates categories.

## Cross-domain communication

**Direct service injection.** Domain modules import each other's NestJS modules and inject services directly — e.g. `BookingService` injects `PaymentService` and `NotificationService`; `DisputeService` injects `WelperPayoutLedgerService`; the admin controller (`src/domains/user-management/admin/admin.controller.ts`) injects `PayoutBatchService`, `StripeOperationsService`, `BookingService`, `SupportTicketService`, and `JobPostingService`.

There is no event bus in the BFF: `packages/events` (`@welpco/events`, a publisher/consumer package) exists in the monorepo but is **not imported anywhere in `apps/bff/src`**, and `@nestjs/event-emitter` is not used.

## Scheduled jobs

`@nestjs/schedule` is enabled globally; the only `@Cron` in the codebase is `PaymentCaptureScheduler.runPaymentOperations` (`src/domains/payment/payment-capture.scheduler.ts`, every 15 minutes) — see [domains/payment.md](domains/payment.md#scheduled-jobs).

## External integrations

- **Stripe** — payments, Connect payouts, Tax, webhooks (`src/domains/payment/`, see [domains/payment.md](domains/payment.md)); also background-check checkout in safety-verification.
- **AWS S3** — uploads and presigned URLs (`src/clients/s3/`).
- Email dispatch via `@welpco/email` templates through the notification domain.
