# Testing

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

## BFF (NestJS) — Jest

### Unit tests

Config is inline in `apps/bff/package.json` (`jest` key): `rootDir: src`, `testRegex: .*\.spec\.ts$`, ts-jest, node environment, setup file `apps/bff/src/test/jest.setup.ts` (globally mocks `bcrypt` hash/compare).

```bash
pnpm --filter @welpco/bff test          # all unit specs
pnpm --filter @welpco/bff test:watch
pnpm --filter @welpco/bff test:cov      # coverage → apps/bff/coverage
pnpm --filter @welpco/bff test:debug    # --inspect-brk --runInBand
```

### E2E tests

Config: `apps/bff/test/jest-e2e.json` — `testRegex: .e2e-spec.ts$`, maps `@welpco/*` imports to `packages/*/src`, setup file `apps/bff/test/jest-e2e.setup.ts`.

The setup file sets `NODE_ENV=test`, `PORT=3000`, `FRONTEND_URL=http://localhost:8080`, and default `JWT_SECRET`/`JWT_REFRESH_SECRET` values. **PostgreSQL must be running with the schema already in place** — TypeORM `synchronize` is off in test, so run migrations (or a seed) first, or point at a dedicated test DB.

Spec files in `apps/bff/test/`: `auth`, `booking`, `content`, `dispute`, `profiles`, `service-discovery`, `signup`, `users` (`*.e2e-spec.ts`). Helpers in `apps/bff/test/helpers/`: `test-auth.helper.ts`, `e2e-domain-mocks.helper.ts`, `test-microservices.helper.ts`.

```bash
pnpm --filter @welpco/bff test:e2e            # all e2e specs
pnpm --filter @welpco/bff test:e2e:watch
pnpm --filter @welpco/bff test:e2e:dispute    # RUN_DISPUTE_E2E=1 gates the dispute suite
pnpm --filter @welpco/bff test:all            # unit then e2e
```

## Web (Next.js) — Playwright

Config: `apps/web/playwright.config.ts`.

- `testDir: ./e2e`; Chromium only; HTML reporter; 30s test timeout; trace/screenshot/video on failure or first retry.
- Browsers install into a project-local cache: `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers` (set by both the npm scripts and the config itself).
- `baseURL`: `PLAYWRIGHT_TEST_BASE_URL` or `http://localhost:8081`.
- `webServer`: runs `pnpm dev` and waits for the base URL; `reuseExistingServer` outside CI — so an already-running `pnpm dev` (web + BFF) is picked up.
- `globalSetup` (`apps/web/e2e/global-setup.ts`): checks BFF health at `{NEXT_PUBLIC_API_URL}/api/health`, checks the frontend, then (if the BFF is up) runs `pnpm seed:users` from the repo root and verifies the e2e user can log in with `onboardingCompleted: true`. `globalTeardown` also exists.
- Test suites live in `apps/web/e2e/`: `auth`, `availability`, `dashboard`, `disputes`, `marketing`, `notifications`, `onboarding`, `personalization`, `profile`, `settings` (+ `fixtures`, `helpers`).

### Commands (`apps/web/package.json`)

```bash
pnpm --filter @welpco/web test:e2e:install          # one-time: install chromium into .playwright-browsers
pnpm --filter @welpco/web test:e2e                  # full suite
pnpm --filter @welpco/web test:e2e:personalization  # e2e/personalization/personalization.spec.ts, list reporter
pnpm --filter @welpco/web test:e2e:profile          # e2e/profile/
pnpm --filter @welpco/web test:e2e:auth             # --grep '@auth'
pnpm --filter @welpco/web test:e2e:ui               # Playwright UI mode
pnpm --filter @welpco/web test:e2e:headed
pnpm --filter @welpco/web test:e2e:debug
```

### Required environment for web e2e

The config loads `apps/web/.env.test.local` if present (template: `apps/web/.env.test.example`). Variable names verified in `playwright.config.ts` and `e2e/global-setup.ts`:

| Variable | Default | Used for |
|---|---|---|
| `TEST_USER_EMAIL` | `e2e-customer@welpco.com` | seeded login user (must match the BFF seed) |
| `TEST_USER_PASSWORD` | `Customer123!` | seeded login password |
| `PLAYWRIGHT_TEST_BASE_URL` / `BASE_URL` | `http://localhost:8081` | frontend under test |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | BFF health check + login verification in global setup |

Prereqs for login-dependent suites: BFF running on 3000, database migrated and seeded (`pnpm db:migrate`, `pnpm seed:users`), Turnstile keys omitted locally so verification is skipped (`apps/web/.env.example`), and platform gating disabled (`PLATFORM_ACCESS_GATED=false` + `NEXT_PUBLIC_PLATFORM_ACCESS_GATED=false` on web, mirrored on the BFF) so seeded users can reach `/dashboard`. Welper-signup tests send the `x-welpco-signup-e2e: 1` header (honored in non-production only) to skip real Stripe/Certn calls (`apps/bff/.env.example`).

## Design system — Storybook a11y

`apps/design-system/package.json`:

```bash
pnpm --filter @welpco/design-system test:a11y         # test-runner against a running Storybook on 6006
pnpm --filter @welpco/design-system test:a11y:static  # serves storybook-static on 6006, then runs test-runner
```

## Other suites

- `packages/eslint-plugin-design`: `pnpm --filter @welpco/eslint-plugin-design test` (`node --test src/rules/*.test.js`).
- `infrastructure/`: `npm test` (Jest, `infrastructure/test/infrastructure.test.ts`) — placeholder stack tests.

## Known gap

Password reset has **no true end-to-end coverage**. What exists (verified):

- BFF `apps/bff/test/auth.e2e-spec.ts` covers `POST /api/auth/reset-password`, `/reset-password/confirm`, and `/change-password`, but with the domain auth service mocked (`mocks.domainAuthService.requestResetPassword...`) — these verify the HTTP contract (including the enumeration-safe `200 { ok: true }` response), not the real reset pipeline.
- Web `apps/web/e2e/auth/password-reset.spec.ts` covers the UI: requesting a reset link, email/password validation, and the invalid-link state — but never completes a reset with a real emailed token.

No test exercises the full flow: request → token email → confirm → login with the new password.
