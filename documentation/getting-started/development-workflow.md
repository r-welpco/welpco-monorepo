# Development Workflow

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

## Root scripts

Every script in the root `package.json`, verified:

| Script | Command | What it does |
|---|---|---|
| `dev` | `turbo run dev --filter=@welpco/web --filter=@welpco/bff --concurrency=2` | Web (8081) + BFF (3000). |
| `dev:pretty` | `concurrently … "pnpm --filter @welpco/web dev" "pnpm --filter @welpco/bff dev"` | Same pair with colored `[WEB]`/`[BFF]` prefixes; bypasses Turbo (no `^build` of packages first). |
| `dev:web` | `turbo run dev --filter=@welpco/web` | Web only. |
| `dev:services` | `turbo run dev --filter=@welpco/bff` | BFF only (name is historical; it is a single backend). |
| `dev:admin` | `turbo run dev --filter=@welpco/admin --filter=@welpco/bff --concurrency=2` | Admin (8082) + BFF (3000). |
| `dev:zellij` | `./scripts/dev-zellij.sh` | Zellij multi-pane layout (path-rewriting wrapper; see warning in [setup.md](setup.md)). |
| `dev:docker` | `docker-compose up -d` | Start postgres + mailhog. |
| `dev:logs` | `docker-compose logs -f` | Tail Docker service logs. |
| `setup` | `./scripts/setup-dev.sh` | One-time bootstrap ([setup.md](setup.md)). |
| `db:migrate` | `pnpm --filter @welpco/bff migration:run` | Run TypeORM migrations (`apps/bff/src/database/run-migrations.ts`). |
| `seed:users` | `pnpm --filter @welpco/bff seed` | Seed users/profiles (`apps/bff/src/database/seeds/run-seed.ts`). |
| `clean:non-admin-users` | `pnpm --filter @welpco/bff clean:non-admin-users` | Delete non-admin users (`apps/bff/src/scripts/clean-non-admin-users.ts`). |
| `create:admin` | `pnpm --filter @welpco/bff create:admin` | Create an admin user (`apps/bff/src/scripts/create-admin-user.ts`). |
| `build` | `turbo run build` | Build all workspaces in dependency order. |
| `test` | `turbo run test` | Run each workspace's `test` task (depends on `build`). |
| `lint` / `lint:root` | `eslint . --max-warnings=9999` | Root flat-config ESLint over the whole repo. |
| `type-check` | `turbo run type-check` | `tsc --noEmit` per workspace. |
| `clean` | `turbo run clean && rm -rf node_modules` | Clean outputs and root node_modules. |
| `prepare` | `husky && node scripts/install-husky-hook.mjs` | Git hooks; lint-staged runs `eslint --fix` on staged `*.{ts,tsx}`. |

## Per-app dev commands

| App | Command | Port |
|---|---|---|
| Web | `pnpm --filter @welpco/web dev` (`next dev -p 8081`) | 8081 |
| Admin | `pnpm --filter @welpco/admin dev` (`next dev -p 8082`) | 8082 |
| BFF | `pnpm --filter @welpco/bff dev` (`nest start --watch`) | 3000 |
| Storybook | `pnpm --filter @welpco/design-system dev` (`storybook dev -p 6006`) | 6006 |
| UI package watch | `pnpm --filter @welpco/ui dev` (`tsc --watch`) | — |

Useful BFF extras (`apps/bff/package.json`): `stripe:listen` (forwards Stripe webhooks to `http://127.0.0.1:3000/api/webhooks/stripe`), `seed:payout-test-bookings`, `seed:service-questions`, `stripe:reconcile-operations`. Web extras: `i18n:audit-service-questions`, `i18n:build-service-questions`.

## Turbo pipeline (`turbo.json`)

| Task | dependsOn | Cache/outputs | Notes |
|---|---|---|---|
| `build` | `^build` | `dist/**`, `.next/**` (minus cache), `build/**`; story files excluded from inputs | `@welpco/web#build` has a dedicated `env` allowlist (Stripe, Turnstile, platform-gate, Zoho, site URLs). |
| `build-storybook` | `^build` | `storybook-static/**` | |
| `dev` | `^build` | uncached, persistent | Dependency packages (`@welpco/ui`, `@welpco/email`, `@welpco/database`) are built before an app's dev server starts. |
| `test` | `build` | none | |
| `lint`, `//#lint:root` | — | none | |
| `type-check` | `^build` | none | |
| `clean` | — | uncached | |

`globalEnv` (invalidates all task caches): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_API_URL`, and the three `NEXT_PUBLIC_ZOHO_SALESIQ_*` vars.

Build ordering detail: `apps/bff` also has its own `prebuild` (`pnpm --filter @welpco/email --filter @welpco/database run build`), so `nest build` works even outside Turbo.

## Lint and type-check

```bash
pnpm lint                          # root ESLint (flat config, eslint.config.js)
pnpm --filter @welpco/web lint     # per-app (next lint-style eslint .)
pnpm --filter @welpco/bff lint     # eslint --fix over src/apps/libs/test
pnpm type-check                    # tsc --noEmit everywhere via turbo
```

## How the apps talk to each other in dev

- **Web → BFF**: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000` in `apps/web/.env.example`). All backend routes are under the `/api` prefix; Swagger at `http://localhost:3000/api/docs` (`apps/bff/src/main.ts`).
- **Admin → BFF**: same `NEXT_PUBLIC_API_URL`; the admin API client falls back to `http://localhost:3000` (`apps/admin/lib/api/client.ts`).
- **BFF CORS** (`buildAllowedCorsOrigins` in `apps/bff/src/main.ts`): if `CORS_ORIGINS` is set it wins; otherwise in development the allowlist is `localhost`/`127.0.0.1` on ports 8080, 8081, 8082 plus `localhost:3000` and `FRONTEND_URL`; in production it is `FRONTEND_URL` only (fallback `http://localhost:8080`).
- **Email in dev**: point the BFF/web at MailHog (`SMTP_HOST=localhost`, `SMTP_PORT=1025`, omit `RESEND_API_KEY`); read mail at http://localhost:8025.
