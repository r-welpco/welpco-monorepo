# Repository Structure

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

pnpm workspace (`pnpm-workspace.yaml`) covering `apps/*` and `packages/*`, orchestrated by Turborepo (`turbo.json`). One workspace-wide override: `@radix-ui/themes` pinned to `3.3.0`.

```
welpco-monorepo/
├── apps/
│   ├── web/            # customer/welper Next.js app (port 8081)
│   ├── admin/          # admin Next.js app (port 8082)
│   ├── bff/            # single NestJS backend (port 3000)
│   └── design-system/  # Storybook workspace (port 6006)
├── packages/           # 7 shared libraries (see below)
├── scripts/            # dev/setup shell scripts
├── infrastructure/     # AWS CDK scaffolding (placeholders, npm-managed)
├── docker-compose.yml  # postgres + mailhog
├── turbo.json
└── pnpm-workspace.yaml
```

## Apps

| App | Package | Stack (verified from `package.json`) |
|---|---|---|
| `apps/web` | `@welpco/web` | Next.js 16.2.3, React 19.2, next-auth v5 beta, next-intl, TanStack Query, Stripe.js, Zustand; Playwright e2e suite in `apps/web/e2e/`. Dev/start on port 8081. |
| `apps/admin` | `@welpco/admin` | Next.js 16.2.3, next-auth v5 beta, TanStack Query, Leaflet (welper distribution map). Talks to the BFF via `NEXT_PUBLIC_API_URL` (`apps/admin/lib/api/client.ts`, default `http://localhost:3000`). Port 8082. |
| `apps/bff` | `@welpco/bff` | NestJS 11 monolith backend ("Backend for Frontend"), TypeORM + PostgreSQL, Passport/JWT, Stripe, Certn, Resend/nodemailer, AWS S3 SDK. Global prefix `/api`, Swagger at `/api/docs` (`apps/bff/src/main.ts`). Port 3000 (`PORT` env). |
| `apps/design-system` | `@welpco/design-system` | Storybook 10 (react-vite) showcasing `@welpco/ui`, with a11y addon and `@storybook/test-runner` + axe-playwright. Port 6006. |

The BFF contains 13 domain modules under `apps/bff/src/domains/`: `booking`, `communication`, `content-management`, `dispute`, `geocode`, `job-posting`, `notification`, `payment`, `profile-management`, `review`, `safety-verification`, `service-discovery`, `user-management`.

**Auth is not a package.** Auth utilities (module, guards, decorators, JWT strategies, `effective-role.util.ts`, `jwt-module-options.factory.ts`) live in `apps/bff/src/common/auth/`. There is no `packages/auth`.

## Packages (all 7, verified)

| Package | Name | Purpose | Entry |
|---|---|---|---|
| `packages/database` | `@welpco/database` | TypeORM connection/config, `database.module.ts`, base entity, migration utilities (`migrations.ts`). Consumed by the BFF. | compiled `dist/index.js` (needs `build`) |
| `packages/email` | `@welpco/email` | Branded email templates, layout/styles, nodemailer SMTP transport + Resend HTTP client (`src/transport.ts`, `src/resend.ts`); MailHog smoke script (`smoke:mailhog`). | compiled `dist/index.js` (needs `build`) |
| `packages/eslint-plugin-design` | `@welpco/eslint-plugin-design` | Plain-JS ESLint plugin enforcing the Welpco UI/UX design rules; rules tested with `node --test`. | `src/index.js` |
| `packages/events` | `@welpco/events` | Event schemas plus publisher/consumer utilities (`schemas.ts`, `publisher.ts`, `consumer.ts`). | `src/index.ts` (consumed as TS source) |
| `packages/shared` | `@welpco/shared` | Shared utilities/helpers (`src/utils/`). | `src/index.ts` |
| `packages/types` | `@welpco/types` | Shared TypeScript types: `src/api/`, `src/domain/`, `src/events/`. | `src/index.ts` |
| `packages/ui` | `@welpco/ui` | Radix UI Themes component wrappers (button, dialog, table, …) plus `platform/` feature components (user-management forms, layout headers, feedback dialogs), each with its own subpath export. | compiled `dist/*` (needs `build`; `dev` = `tsc --watch`) |

`packages/database`, `packages/email`, and `packages/ui` ship compiled output — the BFF's `prebuild` script builds `@welpco/email` and `@welpco/database` first (`apps/bff/package.json`), and Turbo's `dev`/`build` tasks depend on `^build` (`turbo.json`).

## scripts/

| Script | Verified behavior |
|---|---|
| `setup-dev.sh` | Full local bootstrap (see [setup.md](setup.md)). Exposed as `pnpm setup`. |
| `init-db.sh` | Mounted into the postgres container; creates `uuid-ossp` and `pg_trgm` extensions. |
| `reset-db.sh`, `setup-services.sh`, `dev-pretty.sh`, `fix-nestjs-dev.sh` | Auxiliary helpers; not wired into root `package.json` scripts (except `dev:pretty`, which uses `concurrently` directly, not the shell script). |
| `dev-zellij.sh` | Rewrites the hardcoded paths in `.zellij/layouts/welpco-dev.kdl` via `sed`, then launches Zellij. Exposed as `pnpm dev:zellij`. |
| `dev-tmux.sh` | **Broken** — spawns panes for 12 package filters (`user-management`, `payment-processing`, …) that do not exist in the workspace. Do not use. |
| `install-husky-hook.mjs` | Run by the root `prepare` script alongside `husky` (lint-staged runs `eslint --fix` on staged `*.ts/tsx`). |

## infrastructure/

AWS CDK v2 scaffolding (`aws-cdk-lib 2.215.0`, CLI `2.1033.0`), managed with **npm** (`package-lock.json`) and *not* part of the pnpm workspace.

- `bin/infrastructure.ts` instantiates a single `InfrastructureStack` with no env configured (environment-agnostic; account/region lines are commented out).
- `lib/infrastructure-stack.ts` is an **empty placeholder** — its body is a TODO ("Add DatabaseStack (RDS PostgreSQL) and compute for single backend"). Comments explicitly forbid adding MSK/Kafka, OpenSearch, or ElastiCache.
- `lib/stacks/database-stack.ts` is likewise an empty `DatabaseStack` placeholder (TODO: RDS PostgreSQL).
- `cdk.out/` contains a synthesized (empty) template; nothing in the repo indicates an actual AWS deployment. Production hosting hints elsewhere point at Vercel (`apps/bff/.env.example` notes "Vercel BFF", Resend-over-HTTP because "SMTP ports are blocked").

## Tooling files

| File | Role |
|---|---|
| `turbo.json` | Task pipeline: `build` → `^build`, `dev` persistent/uncached with `^build`, `test` → `build`, `type-check` → `^build`; `globalEnv` for auth/API/Zoho vars; a large `env` allowlist on `@welpco/web#build`. See [development-workflow.md](development-workflow.md). |
| `pnpm-workspace.yaml` | Workspace globs `apps/*`, `packages/*`; `@radix-ui/themes` override. |
| `eslint.config.js` | Root flat ESLint config (run via `pnpm lint`), uses `@welpco/eslint-plugin-design`. |
| `tsconfig.json` | Root TS config. |
| `docker-compose.yml` | postgres + mailhog (see [setup.md](setup.md)). |
