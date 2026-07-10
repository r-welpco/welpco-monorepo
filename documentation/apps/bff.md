# apps/bff — Backend for Frontend (NestJS)

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

NestJS 11 API serving both Next.js frontends ([web](web.md), [admin](admin.md)). Single deployable backend: Postgres via TypeORM, Stripe, S3, Resend email, scheduled jobs.

- **Port**: `process.env.PORT ?? 3000` (`apps/bff/src/main.ts`)
- **Global prefix**: `api` — every route is `/api/...`
- **Swagger**: `/api/docs` (Bearer JWT auth support; **disabled when `NODE_ENV === 'production'`**)
- **CORS**: dev allows localhost `8080–8082`/`3000`; production uses `CORS_ORIGINS` (comma-separated) or `FRONTEND_URL`
- Global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`), `HttpExceptionFilter`, `LoggingInterceptor`, helmet, raw body enabled for Stripe webhook signature verification (`/api/webhooks/stripe`).

Code lives under `apps/bff/src/domains/*` (booking, payment, dispute, user-management, service-discovery, ...) plus legacy-style `src/modules/*` (auth, users, profiles, content, notifications, uploads). For depth see:

- [../architecture/backend-overview.md](../architecture/backend-overview.md) — architecture, cross-cutting concerns
- [../architecture/domains/README.md](../architecture/domains/README.md) — per-domain reference
- [../architecture/authentication.md](../architecture/authentication.md) — JWT auth, guards, token issuance

## Scripts (`apps/bff/package.json`, selected)

| Script | Command | Notes |
|---|---|---|
| `dev` | `nest start --watch` | Also `start:dev`, `start:debug` |
| `build` | `nest build` | `prebuild` builds `@welpco/email` + `@welpco/database` first |
| `test` | `jest` | Unit tests (`*.spec.ts` under `src/`) |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | Variants: `test:e2e:dispute`, `test:e2e:watch`, `test:all` |
| `seed` | `ts-node src/database/seeds/run-seed.ts` | Also `seed:payout-test-bookings`, `seed:service-questions` |
| `migration:run` | `ts-node src/database/run-migrations.ts` | Migrations live per-domain (e.g. `src/domains/payment/migrations/`) |
| `stripe:listen` | `stripe listen --forward-to http://127.0.0.1:${PORT:-3000}/api/webhooks/stripe` | Local webhook forwarding |
| `create:admin` | `ts-node src/scripts/create-admin-user.ts` | Bootstrap an admin account |
