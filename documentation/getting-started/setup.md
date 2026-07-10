# Local Setup

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

## Prerequisites

| Tool | Version | Source |
|---|---|---|
| Node.js | 22.x (Volta pin: 22.21.1) | `package.json` `engines.node` / `volta` |
| pnpm | >= 9.0.0 (`packageManager: pnpm@9.0.0`) | `package.json` |
| Docker + docker-compose | any recent | required by `scripts/setup-dev.sh` |

Optional: Stripe CLI (for `pnpm --filter @welpco/bff stripe:listen`), Zellij or tmux (see warning below).

## Docker services

`docker-compose.yml` defines two services on the `welpco-network` bridge network:

| Service | Image | Ports | Credentials / notes |
|---|---|---|---|
| `postgres` (container `welpco-postgres`) | `postgres:16.6-alpine` | 5432:5432 | user `welpco`, password `welpco_dev`, db `welpco_dev`. Healthcheck: `pg_isready -U welpco -d welpco_dev` every 10s. Data persisted in the `postgres_data` volume. `scripts/init-db.sh` is mounted as an init script and creates the `uuid-ossp` and `pg_trgm` extensions. |
| `mailhog` (container `welpco-mailhog`) | `mailhog/mailhog:latest` | 1025:1025 (SMTP), 8025:8025 (web UI) | Local email capture. Healthcheck: `wget --spider http://localhost:8025`. |

There is no Redis, Kafka, or OpenSearch — the BFF uses an in-memory cache locally (`.env.example` and `infrastructure/lib/infrastructure-stack.ts` both state this constraint).

Start/stop manually:

```bash
pnpm dev:docker      # docker-compose up -d
pnpm dev:logs        # docker-compose logs -f
```

## What `pnpm setup` (`scripts/setup-dev.sh`) does

Verified step by step from `scripts/setup-dev.sh`:

1. Fails fast if Docker is not running (`docker info`).
2. `docker-compose up -d` from the repo root (PostgreSQL + MailHog).
3. Polls `docker exec welpco-postgres pg_isready` until PostgreSQL is ready.
4. `pnpm install`.
5. Creates `apps/bff/.env.local` if missing — copied from `apps/bff/.env.example` when present, otherwise written inline with DB credentials, JWT dev secrets, `PORT=3000`, `FRONTEND_URL=http://localhost:8081`, and `GOOGLE_MAPS_API_KEY=local-dev-placeholder`.
6. Ensures `GOOGLE_MAPS_API_KEY` is non-empty in `apps/bff/.env.local` — the BFF refuses to boot with an empty value (`GoogleMapsGeocodeService.onModuleInit`). The placeholder only satisfies startup; address features need a real key.
7. Creates `apps/web/.env.local` from `apps/web/.env.example` if missing.
8. Runs migrations: `pnpm --filter @welpco/bff migration:run`.
9. Seeds the database: `pnpm seed:users`. Seeded test accounts: `customer@welpco.com` / `Customer123!` and `welper@welpco.com` / `Welper123!`.

Note: the script does **not** create `apps/admin/.env.local` — copy `apps/admin/.env.example` yourself if you run the admin app.

## Env example files

| File | Copied to | By |
|---|---|---|
| `apps/bff/.env.example` | `apps/bff/.env.local` | `scripts/setup-dev.sh` (if missing) |
| `apps/web/.env.example` | `apps/web/.env.local` | `scripts/setup-dev.sh` (if missing) |
| `apps/admin/.env.example` | `apps/admin/.env.local` | manual |
| `apps/web/.env.test.example` | `apps/web/.env.test.local` | manual (Playwright e2e — see [testing.md](testing.md)) |
| `.env.example` (repo root) | — | reference only; nothing copies it automatically |

## First run

```bash
pnpm setup           # one-time: docker, install, env files, migrate, seed
pnpm dev             # web (8081) + bff (3000) via turbo
# or
pnpm dev:pretty      # same two apps via concurrently with colored prefixes
pnpm dev:admin       # admin (8082) + bff (3000)
```

Verify: Swagger at http://localhost:3000/api/docs (`apps/bff/src/main.ts` sets global prefix `api` and mounts Swagger at `api/docs`), web at http://localhost:8081, MailHog UI at http://localhost:8025.

## Ports

| Port | What | Defined in |
|---|---|---|
| 8081 | Web app (Next.js) | `apps/web/package.json` (`next dev -p 8081`) |
| 8082 | Admin app (Next.js) | `apps/admin/package.json` (`next dev -p 8082`) |
| 3000 | BFF (NestJS, global prefix `/api`, Swagger `/api/docs`) | `apps/bff/src/main.ts` (`PORT` env, default 3000) |
| 6006 | Storybook (design system) | `apps/design-system/package.json` (`storybook dev -p 6006`) |
| 5432 | PostgreSQL | `docker-compose.yml` |
| 1025 | MailHog SMTP | `docker-compose.yml` |
| 8025 | MailHog web UI | `docker-compose.yml` |

## Warning: broken/fragile launcher scripts

- **`scripts/dev-tmux.sh` is broken.** It launches `pnpm --filter user-management dev`, `profile-management`, `service-discovery`, `payment-processing`, and eight more filters that do not exist as packages — the workspace only contains `@welpco/web`, `@welpco/admin`, `@welpco/bff`, `@welpco/design-system`, and the seven `packages/*` libraries. Those panes all fail.
- **`.zellij/layouts/welpco-dev.kdl` has hardcoded paths** (`cwd "/Users/rabie/Developer/welpco/welpco-monorepo"` in every pane). `scripts/dev-zellij.sh` rewrites them with `sed` at launch time, but the layout is unusable directly and depends on that rewrite working.

Prefer the plain pnpm commands: `pnpm dev`, `pnpm dev:admin`, `pnpm dev:pretty` (see [development-workflow.md](development-workflow.md)).
