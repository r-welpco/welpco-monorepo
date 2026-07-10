# Codebase Map

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Fast orientation for the pnpm/turbo monorepo (Node 22.x, pnpm 9).

## Apps (`apps/`)

| App | Package | What it is |
|---|---|---|
| `web` | `@welpco/web` | Customer/welper Next.js app (port 8081) |
| `admin` | `@welpco/admin` | Internal admin Next.js app (port 8082) |
| `bff` | `@welpco/bff` | NestJS backend-for-frontend — all API + domain logic (port 3000) |
| `design-system` | `@welpco/design-system` | Storybook for the shared UI (port 6006) |

## Packages (`packages/`)

| Package | What it is |
|---|---|
| `ui` | Shared UI components on Radix UI Themes; home of `ui-ux-bible.md` and `PLATFORM-UX.md` (design authorities) |
| `database` | Base entity + TypeORM connection/migration utilities (`@welpco/database`, used by BFF) |
| `email` | Branded email templates + SMTP transport (used by BFF) |
| `events` | Event schemas + publisher/consumer utilities — **present but not currently imported by any app** |
| `shared` | Shared utilities and helpers |
| `types` | Shared TypeScript types and interfaces |
| `eslint-plugin-design` | Custom ESLint rules enforcing the UI/UX bible (see [conventions.md](conventions.md)) |

## The 13 BFF domains (`apps/bff/src/domains/`)

Each is a NestJS module: `<domain>.module.ts`, controllers, services, `dto/`, `entities/`, `migrations/`. Details: [../architecture/domains/README.md](../architecture/domains/README.md).

| Domain | Purpose |
|---|---|
| `booking` | Booking lifecycle — requests, state machine, pricing, scheduling, receipts |
| `communication` | Customer↔welper chat and inbox |
| `content-management` | Service categories/taxonomy, service questions, FAQ, static content, holidays |
| `dispute` | Disputes and support tickets |
| `geocode` | Google Maps geocoding with rate limiting |
| `job-posting` | Job posts, eligibility, posting state machine |
| `notification` | In-app + email notifications, templates, locale handling |
| `payment` | Stripe: payments/captures, taxes, payout batches + ledger, Connect onboarding, webhooks |
| `profile-management` | Customer/welper profiles, availability calendars, favorites |
| `review` | Reviews and ratings |
| `safety-verification` | Certn background checks, guardian consent |
| `service-discovery` | Welper search and marketplace eligibility |
| `user-management` | Accounts, auth flows, admin endpoints, referrals, guardians, email verification |

## Cross-cutting locations

- `apps/bff/src/common/` — shared BFF infrastructure: `auth/` (JWT guards, `@Roles`/`@CurrentUser` decorators, strategies, `auth.module.ts`), `guards/`, `filters/`, `interceptors/`, `dto/`, `constants/`, `base-entity.ts` (re-exports `BaseEntity` from `@welpco/database`).
- `apps/bff/src/database/` — `database.module.ts`, `run-migrations.ts` (migration runner), `db-cli-options.ts`, `seeds/`.
- `packages/events/` — event schemas/publisher/consumer; not wired into any app today. Verify before assuming an event bus exists (local dev has no Kafka — see root `.env.example`).

## Ports

| Service | Port | Where defined |
|---|---|---|
| web | 8081 | `apps/web/package.json` (`next dev -p 8081`) |
| admin | 8082 | `apps/admin/package.json` (`next dev -p 8082`) |
| bff | 3000 | `apps/bff/src/main.ts` (`process.env.PORT ?? 3000`) |
| storybook | 6006 | `apps/design-system/package.json` (`storybook dev -p 6006`) |
| postgres | 5432 | `docker-compose.yml` |

## Env examples

- Root: `.env.example` (copy to `.env.local`)
- Per app: `apps/web/.env.example`, `apps/web/.env.test.example`, `apps/admin/.env.example`, `apps/bff/.env.example`

## Migrations — two kinds of locations

Both discovered automatically by `apps/bff/src/database/run-migrations.ts` (globs `src/**/migrations/*-*.{ts,js}`, sorted by timestamp prefix):

1. `apps/bff/src/database/migrations/` — cross-domain migrations
2. `apps/bff/src/domains/<domain>/migrations/` — per-domain migrations (11 domains have one)

Run: `pnpm --filter @welpco/bff migration:run`. More: [../operations/migrations.md](../operations/migrations.md).

## Seeds

`apps/bff/src/database/seeds/` — entry `run-seed.ts` → `seed.ts` orchestrator plus focused seeders (`seed-content.ts`, `seed-holidays.ts`, `seed-quebec-welpers.ts`, …). Scripts: `pnpm --filter @welpco/bff seed`, `seed:payout-test-bookings`, `seed:service-questions`.

## E2E tests

- BFF: `apps/bff/test/` — Jest `*.e2e-spec.ts` + `helpers/`, config `test/jest-e2e.json`, run with `pnpm --filter @welpco/bff test:e2e`
- Web: `apps/web/e2e/` — Playwright suites by feature area, run with `pnpm --filter @welpco/web test:e2e`
