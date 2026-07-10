# Implementation Risks & Required Changes

> Last verified: 2026-07-03 · commit de88bd4 · derived from the 2026-07-03 platform audit

Items that need action in the **code, tooling, or process** — not documentation fixes. Ordered by priority.

## P0 — Correctness / money path

### 1. `approved` payout-batch status is defined but never set
Verified at de88bd4: `PayoutBatchStatus` contains `approved`, and migration `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts` includes it in the active-Friday unique index predicate (`review`/`approved`/`executing`) — but **no code path ever sets a batch to `approved`**: admin approve+execute transitions `review` → `executing` in one step. The status is effectively reserved. Risks: operators and queries can expect a state that never occurs, and a future change that starts setting it must revisit every transition and crash-recovery path (especially crash between approve and execute) — none of which exist today. Either implement the two-step approve flow deliberately, or keep it explicitly documented as reserved (the new [payment runbook](../operations/payment-operations-runbook.md) documents the current reality).

### 2. Password-reset flow is never tested end-to-end with a real token
Coverage exists but is shallower than it looks: `apps/bff/test/auth.e2e-spec.ts` exercises the reset endpoints with mocked services, and `apps/web/e2e/auth/password-reset.spec.ts` tests the UI — but no test completes the full flow (request reset → receive emailed token → confirm with that token). For an account-takeover-sensitive path, add one BFF e2e that drives the real service chain (MailHog can capture the email locally).

### 2b. Certn webhook accepts unsigned payloads when the secret is unset
The safety-verification Certn webhook verifies HMAC signatures only if `CERTN_WEBHOOK_SECRET` is configured — otherwise it **accepts the payload with just a warning log**. A misconfigured production environment would let anyone forge background-check results. Make signature verification fail-closed outside local dev (reject if the secret is missing or the signature is invalid).

## P1 — Broken or hazardous tooling

### 2c. Legacy `apps/bff/src/modules/` facade shadows domain controllers
A pre-domain-refactor layer at `apps/bff/src/modules/` (auth, users, profiles, content, notifications) registers controller paths that overlap the domain modules. Because `modules/auth` is imported before the domain in `app.module.ts`, it wins route registration — it is the only place the signup wizard (`/api/auth/signup/*`) is actually exposed, the domain's copy in `user-management/auth/` is deliberately unmounted (`registerController: false`), and the notification domain has no controller at all (its HTTP surface lives in `modules/notifications`). This import-order-dependent routing is fragile and misleading; consolidate each HTTP surface into one layer (fold `modules/*` into the domains, or document `modules/` as the sole controller layer) before it causes a shadowed-route bug.

### 3. `scripts/dev-tmux.sh` is dead code
References 12+ packages that don't exist (`user-management`, `profile-management`, `service-discovery`, … from the abandoned microservices layout). Anyone running it gets pnpm filter failures. Delete it, or rewrite for the real topology (bff + web + admin + design-system).

### 4. Zellij layout has hardcoded personal paths
`.zellij/layouts/welpco-dev.kdl` hardcodes `cwd "/Users/rabie/Developer/welpco/welpco-monorepo"` (5 panes) — which is not even this checkout's path; `scripts/dev-zellij.sh` patches it with `sed`. Replace with relative/`current-dir` cwd. The Storybook pane is commented out while the root README advertises Storybook — reconcile.

### 5. Root `.env.example` wrong port
`WEB_PORT=8080` vs actual web port **8081** (`apps/web/package.json` → `next dev -p 8081`). Fix or remove the variable.

## P2 — Missing infrastructure / process

### 6. No CI at all
No `.github/workflows/`. Nothing runs lint, type-check, unit, or e2e tests on push/PR. Given commit messages are non-descriptive (`update` × many), there is effectively no quality gate. Minimum viable: one workflow running `pnpm lint`, `pnpm type-check`(or `tsc -b`), BFF unit tests, and build on PR.

### 7. No deployment pipeline or documented deploy path
No `vercel.json`, no deploy workflow; `infrastructure/` CDK contains placeholders (e.g. RDS "to be implemented") with no evidence of live deployment. Decide and implement the target (Vercel for web/admin + container/host for BFF, or full CDK), including how migrations run in production. See [../operations/deployment.md](../operations/deployment.md) for the current-state description.

### 8. Migration workflow gaps
Migrations live in two locations (`apps/bff/src/database/migrations/` and `apps/bff/src/domains/payment/migrations/`) merged at runtime by `src/database/run-migrations.ts`. There is no `migration:create` script and the rollback path is unverified. Add a generator script and verify/document `down()` behavior — especially for index-swapping migrations like the Friday-index one.

### 9. In-memory cache constrains scaling
BFF caching is in-memory (Redis intentionally deferred — `apps/bff/docs/REDIS_MIGRATION_GUIDE.md` is a plan, not reality). Any horizontal scaling of the BFF invalidates cache assumptions (and anything else relying on single-process state, e.g. rate limiting). Revisit before running >1 instance.

## P3 — Hygiene

### 9b. Vestigial workspace packages
Verified at audit time: `@welpco/shared` has zero consumers and comment-only index files; `@welpco/events` is a no-op publisher/consumer with zero consumers; `@welpco/database` is consumed only for `BaseEntity` (re-exported via `apps/bff/src/common/base-entity.ts`) — its `DatabaseModule`, TypeORM helpers, and stub `MigrationRunner` are superseded by `apps/bff/src/database/`. Decide per package: delete, or wire in for real. Dead packages mislead newcomers and slow installs/builds.

### 9c. Design lint rules are warnings only, and the marketing exemption isn't configured
All 7 `eslint-plugin-design` rules run at `warn` in root `eslint.config.js`, so design-bible violations never fail anything. Separately, `apps/web/components/features/marketing/CLAUDE.md` documents an exemption for that folder, but no such override exists in the eslint config (verified by grep) — the policy and the tooling disagree. Either escalate rules to `error` with an explicit marketing override, or update the CLAUDE.md policy to match reality.

### 10. No LICENSE file
Legal status of the repo is undefined. Add a LICENSE (or a proprietary notice) at root.

### 11. Swagger gaps and duplicate health controllers
3 health controllers (user-management, profile-management, content-management) lack `@ApiTags`; `apps/bff/src/domains/content-management/app.controller.ts` is undecorated. Additionally there are **four** `@Controller('health')` classes (those three plus top-level `src/health`) — consolidate to one. Minor.

### 12. Commit message convention
Recent history is dominated by `update` commits. Adopt a minimal convention (imperative subject naming the area, e.g. `payment: gate Friday index on approved batches`) — this is the cheapest traceability win available, and it matters more given there's no CI or PR review trail.

### 12b. Admin token refresh hardcodes the access-token TTL
The admin app schedules JWT refresh assuming a fixed 15-minute access-token lifetime, while the web app decodes the real `exp` claim from the token. If the BFF's TTL config ever changes, admin sessions will refresh too late (or wastefully early) with no error surfaced. Align admin with the web approach (decode `exp`). See `documentation/architecture/authentication.md` for the verified flow.

### 13. NextAuth v5 (beta) dependency
The web/admin apps authenticate with NextAuth v5 while it is pre-stable. Pin the exact version, watch for breaking changes on upgrade, and record the upgrade decision when v5 goes stable.
