# Documentation Audit — Welpco Monorepo

> **Date:** 2026-07-03
> **Scope:** All documentation in the monorepo — root/setup docs, architecture docs (`updated_functional_architecture/`, `bible/`, `features/`), app-level docs (`apps/*`), package docs (`packages/*`), and operational docs (runbooks, API docs, env vars, migrations, deployment).
> **Method:** Every doc verified against the code it describes (commands vs `package.json`, entities vs `apps/bff/src/domains/`, endpoints vs controllers, env vars vs `.env.example` files, git timestamps for staleness).

---

## Executive summary

Documentation volume is high (~60 files) and the specialized docs are strong — `ui-ux-bible.md`, `PLATFORM-UX.md`, `bible/testing.md`, the web auth docs, and the e2e docs all verified accurate. The problems are concentrated in four areas:

1. **Accuracy drift** — the Payment Processing architecture doc describes entities that don't exist; the root README lists a package that doesn't exist and omits two that do; `apps/web/README.md` is untouched `create-next-app` boilerplate with the wrong port.
2. **Broken documented tooling** — `scripts/dev-tmux.sh` references 12+ non-existent packages; the Zellij layout hardcodes a personal filesystem path.
3. **Missing foundational docs** — no CONTRIBUTING, LICENSE, DEPLOYMENT, or migration-workflow docs; 6 of 7 packages and the design-system app have no README.
4. **Unarchived historical docs** — deferred plans and completed investigations (Redis migration guide, profile wire-align investigation, endpoint audit) sit alongside current docs with no status markers, and at least one contains claims now known to be false.

Staleness pattern: architecture/feature docs last touched **2026-05-13** (~7 weeks behind code), root docs **2026-06-16**, while code is active through **2026-06-29**.

---

## High-severity findings

### H1. Payment Processing domain doc describes non-existent entities
`updated_functional_architecture/03-Domain-Details/03-06-Payment-Processing-Domain.md` (lines ~122–219) documents `PaymentTransaction` (with a `transactionType` enum), `WelperPayoutAccount`, `PromoCode`, and `Invoice`. **None of these exist.** Actual entities in `apps/bff/src/domains/payment/entities/` are `booking-payment.entity.ts` (status enum: PENDING/REQUIRES_ACTION/AUTHORIZED/CAPTURED/CANCELED/FAILED), `booking-refund.entity.ts`, `payout-batch.entity.ts`, `welper-payout-ledger.entity.ts`. This is the most critical domain on the platform documented against a schema that was never built (or was redesigned without a doc update). Anyone integrating from the doc will build against wrong contracts.

### H2. `apps/web/README.md` is create-next-app boilerplate
Identical to the Next.js starter template: generic `npm run dev`/`yarn dev` instructions, points at `http://localhost:3000` while the app actually runs on **8081** (`"dev": "next dev -p 8081"`), and documents none of the real scripts (`lint`, `type-check`, `test:e2e`, `test:e2e:ui`, `test:e2e:personalization`). The monorepo's largest app has effectively no README.

### H3. Documented dev scripts are broken
- `scripts/dev-tmux.sh` (lines 28–46) starts `pnpm --filter user-management dev`, `profile-management`, `service-discovery`, etc. — **12+ packages that don't exist**. Only `@welpco/web`, `@welpco/bff`, `@welpco/admin`, `@welpco/design-system` are real. The script fails outright; it dates from a pre-consolidation microservices layout.
- `.zellij/layouts/welpco-dev.kdl` hardcodes `cwd "/Users/rabie/Developer/welpco/welpco-monorepo"` in 5 panes (also the wrong path for this checkout — repo lives under `TowerGit/`). `dev-zellij.sh` patches it with `sed`, which is fragile. The Storybook pane is commented out even though the root README lists Storybook (6006) as an available service.

### H4. Payment runbook doesn't cover the in-flight `approved` batch status
`docs/payment-operations-runbook.md` describes batch states `executing`/`partial`/`failed` and an approve→execute flow with no intermediate state. The uncommitted migration `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts` adds `'approved'` to the active-Friday partial index, but the runbook says nothing about an APPROVED stage, what operators should do with a batch stuck in it, or how it transitions to EXECUTING. Update the runbook in the same PR as the status change — this is the doc on-call operators will reach for.

### H5. Missing foundational documentation
- **No CONTRIBUTING.md** (branching, PR process, commit conventions, review standards) and **no LICENSE** at root.
- **No DEPLOYMENT docs at all**: no `.github/workflows/`, no `vercel.json`, and `infrastructure/README.md` describes CDK structure without saying what is actually deployed vs scaffolded. There is no documented path from merge to production, including how migrations run in prod.
- **No migration workflow doc**: `pnpm db:migrate` exists but nothing explains file naming, where migrations live (they're split between `apps/bff/src/database/migrations/` and `apps/bff/src/domains/payment/migrations/`), how to create one, or rollback procedure.
- **6 of 7 packages have no README** (`ui`, `database`, `shared`, `types`, `events`, `email` — only `eslint-plugin-design` has one), and `apps/design-system` has none (Storybook port 6006 undocumented). `packages/ui` has three deep docs (bible, PLATFORM-UX, ROADMAP) but no entry-point README pointing to them.

---

## Medium-severity findings

### M1. Root README structure section is wrong
`README.md` lists a `packages/auth/` that **does not exist** (auth lives in `apps/bff/src/common/auth/`) and omits `packages/email` and `packages/eslint-plugin-design`. The "Manual setup" section is out of sync with `scripts/setup-dev.sh` (script also creates `apps/web/.env.local` and appends `GOOGLE_MAPS_API_KEY`; manual steps don't). Root `.env.example` says `WEB_PORT=8080` but the web app runs on 8081.

### M2. `apps/bff/ENDPOINTS_AUDIT.md` contains a falsified claim
It marks `GET /api/profiles/me/favorites` as "❌ Missing" but the endpoint exists (`@Get('me/favorites')` in the profiles controller). Other spot-checked endpoints matched, so it's one stale claim — but an "audit" doc with a known-false assertion undermines trust in the whole file. Fix the entry or archive the doc with a date stamp.

### M3. Booking domain doc contradicts itself on status model
`03-05-Booking-Scheduling-Domain.md` states correctly (line ~24) that there is **no** `confirmed` status, yet its own state-transition table (line ~77) shows `Accepted → Confirmed`. Code enum: `PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, PAYMENT_RELEASED, DECLINED, CANCELLED, DISPUTED, NO_SHOW`. Remove the `Confirmed` box from the diagram.

### M4. Domain catalog inventory is incomplete
`02-Domain-Catalog.md` declares "14 functional domains" and its status table has 14 rows; the code has a 15th (`geocode`), which is documented in `03-00-BFF-Domain.md` but absent from the main catalog and status table.

### M5. Historical/deferred docs are unmarked and clutter search
- `apps/bff/docs/REDIS_MIGRATION_GUIDE.md` — detailed migration plan, but Redis is **not implemented** (BFF README: "Cache: In-memory"). Reads as current guidance.
- `apps/bff/docs/PROFILE_WIRE_ALIGN_INVESTIGATION.md` — investigation prescribing fixes, no record of whether they landed (at least one prescribed fix, the favorites endpoint, did land).
- `apps/bff/TESTING_UPDATES.md` — completed refactor log; flags password-reset E2E gaps (⚠️) with no follow-up.
- `docs/audit-booking-scheduling.md` — says "all issues addressed" without verification evidence.
Recommendation: create `docs/archive/` (or add a `> **STATUS:** historical/deferred — <date>` header to each) so searches for "Redis" or "favorites" don't surface stale plans as current state.

### M6. Plans without status tracking
- `apps/web/WEB-APP-PLAN.md` — 2,100+ lines, last revised 2026-04-24, specifies 14 routes + landing redesign with **no indication of what shipped** (AUDIT-LOG.md shows substantial work landed since).
- `packages/ui/ROADMAP.md` — "Apps audit + polish" marked in-progress since the 2026-04-24 handoff, no update.
- `features/*.md` — a mix of shipped, in-progress, and aspirational tickets with inconsistent labeling (strikethrough sometimes; the README table helps but individual files aren't self-contained). Add a status legend/header per file.

### M7. Systemic staleness
`updated_functional_architecture/`, `bible/`, `features/` last touched 2026-05-13; root docs 2026-06-16; code active through 2026-06-29. There is no process forcing doc updates alongside code changes (see recommendation R6).

---

## Low-severity findings

- 3 health controllers lack `@ApiTags` (Swagger otherwise well-covered — see below).
- `PROJECT_REPORT.md` header says "Date: March 7, 2026" but was last modified June 16 — add a "Last updated" field.
- `apps/admin/README.md` says "copy `.env.example`" without listing required variables; build-order example is generic boilerplate.
- Seed-only env vars (`DISABLE_RATE_LIMIT`, `SEARCH_CATEGORY_ID`, `EXPECTED_WELPER_EMAIL`) undocumented — acceptable, but a one-line mention in a seeds README would help.
- `setup-dev.sh` polls postgres manually instead of leveraging the docker-compose healthcheck (works fine; minor duplication).

---

## What verified clean ✅

| Doc | Verdict |
|---|---|
| `bible/testing.md` | Commands, frameworks, helpers, and test credentials all match code |
| Swagger/OpenAPI | Live at `/api/docs`; 31/34 controllers tagged; AdminController fully decorated |
| `.env.example` files (root, bff, web, admin) | Present and thorough, with explanatory comments (one wrong port aside) |
| `packages/ui/ui-ux-bible.md`, `PLATFORM-UX.md` | Current; enforced by the eslint-plugin-design rules |
| `apps/web/docs/` (auth architecture, auth alignment, availability UX) | Accurate vs implementation |
| `apps/web/e2e/` docs (README, ENV_SETUP, E2E_TESTING_SUMMARY) | Current and comprehensive |
| `apps/web/AUDIT-LOG.md` | Well-maintained running log |
| `docs/pwa.md`, `docs/category-hierarchy.md`, `docs/audit-search-welpers.md` | Current |
| `apps/web/components/features/marketing/CLAUDE.md` | Correct and necessary policy doc |

---

## Recommendations (priority order)

**Fix now (small, high-impact):**
1. **R1** — Rewrite `apps/web/README.md` (real port, real scripts, monorepo context). ~30 min.
2. **R2** — Delete or rewrite `scripts/dev-tmux.sh`; replace hardcoded paths in the Zellij layout with `zellij` cwd-relative config.
3. **R3** — Fix root `README.md` package list (drop `auth/`, add `email/`, `eslint-plugin-design/`) and `WEB_PORT` in root `.env.example`.
4. **R4** — Update `docs/payment-operations-runbook.md` for the `approved` batch status **in the same PR** as the payout-batch changes currently in the working tree.
5. **R5** — Fix the false `me/favorites` entry in `ENDPOINTS_AUDIT.md`.

**This sprint:**
6. **R6** — Correct the Payment Processing domain doc entities (H1), the booking state diagram (M3), and the domain catalog count (M4). Add a `module:` code-pointer + "last verified" line to each architecture doc so drift is visible.
7. **R7** — Create `docs/archive/` and move/mark the historical docs (M5) with status headers.
8. **R8** — Add one-paragraph READMEs to the 6 undocumented packages + `apps/design-system` (purpose, how to import, link to deeper docs).
9. **R9** — Write `CONTRIBUTING.md` and `apps/bff/MIGRATIONS.md` (workflow, naming, the two migration locations, rollback).

**Later:**
10. **R10** — `DEPLOYMENT.md` covering the merge→prod path for web/admin/bff, prod migration procedure, and what in `infrastructure/` is actually deployed.
11. **R11** — Add status headers to `features/*.md` and an execution tracker to `WEB-APP-PLAN.md` / `ROADMAP.md`.
12. **R12** — Process guard: PR template checkbox or CI warning when `apps/bff/src/domains/**` changes without touching the corresponding domain doc.
