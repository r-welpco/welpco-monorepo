# Legacy Documentation Cleanup Plan

> Last verified: 2026-07-03 · commit de88bd4 · derived from the 2026-07-03 documentation audit

The new `documentation/` tree is generated from the implementation and supersedes the legacy docs. **Nothing is deleted until the new tree is validated** (see process at the bottom). This file maps every legacy doc to its fate.

Legend: **Delete** = superseded, remove. **Keep** = still authoritative, referenced by the new tree. **Fold** = merge remaining useful content into the listed replacement first, then delete.

## Root

| Legacy | Fate | Replacement / notes |
|---|---|---|
| `README.md` | **Fold** | Rewrite as a short landing page: what welpco is + quickstart + link to `documentation/`. Current version has a wrong package list (`packages/auth` doesn't exist; `email`, `eslint-plugin-design` missing) and out-of-sync manual setup. |
| `PROJECT_REPORT.md` | **Delete** | Point-in-time report (March, edited June). Historical; git history preserves it. |
| `ZELLIJ-SETUP.md` | **Delete** | Superseded by `documentation/getting-started/setup.md`. Layout itself needs fixing first (see implementation-risks #4). |
| `.env.example` (root) | **Fix** | Not a doc to delete — correct `WEB_PORT` (risks #5). |

## Architecture & feature trees

| Legacy | Fate | Replacement / notes |
|---|---|---|
| `updated_functional_architecture/` (all 20 files) | **Delete** | Superseded by `documentation/architecture/`. Known-wrong content: Payment doc describes non-existent entities (`PaymentTransaction`, `PromoCode`, `Invoice`, `WelperPayoutAccount`); booking doc shows non-existent `Confirmed` status; catalog omits `geocode`. Do not fold — regenerated from code instead. |
| `features/*.md` | **Fold → Delete** | These are backlogs/specs, not documentation. Any still-open ticket worth keeping should move to the issue tracker (or a single `documentation/improvements/` note); shipped items are covered by the new domain docs. |
| `bible/web-app.md`, `bible/ui-ux.md` | **Delete** | Superseded by `documentation/apps/web.md` + `packages/ui/ui-ux-bible.md` (which remains the design authority). |
| `bible/testing.md` | **Delete** | Was accurate; superseded by `documentation/getting-started/testing.md`. |

## `docs/`

| Legacy | Fate | Replacement / notes |
|---|---|---|
| `docs/payment-operations-runbook.md` | **Delete** | Superseded by `documentation/operations/payment-operations-runbook.md` (covers `approved` status). |
| `docs/pwa.md` | **Fold** | Audited current — fold into `documentation/apps/web.md` (PWA section) then delete. |
| `docs/category-hierarchy.md` | **Fold** | Audited current — fold into `documentation/architecture/domains/service-discovery.md` or keep as reference under `documentation/architecture/`. |
| `docs/design-search-view-and-book.md` | **Delete** | Design intent doc; implemented. Git history preserves it. |
| `docs/audit-booking-scheduling.md`, `docs/audit-search-welpers.md`, `docs/audit-vercel-react-best-practices.md`, `docs/audit-documentation.md` | **Keep (archive)** | Move to `documentation/improvements/audits/` as historical audit records once cleanup starts. |

## `apps/`

| Legacy | Fate | Replacement / notes |
|---|---|---|
| `apps/web/README.md` | **Replace** | create-next-app boilerplate (claims port 3000). Replace with 5-line pointer to `documentation/apps/web.md`. |
| `apps/web/WEB-APP-PLAN.md` | **Delete** | 2,100-line April handoff brief, no status tracking. Execution history lives in AUDIT-LOG; current state in new docs. |
| `apps/web/AUDIT-LOG.md` | **Keep** | Well-maintained running log; keep as the web app's changelog until a better mechanism exists. |
| `apps/web/docs/AUTHENTICATION_ARCHITECTURE.md`, `AUTHENTICATION_ALIGNMENT.md`, `AVAILABILITY_UX.md` | **Fold → Delete** | Accurate; content absorbed into `documentation/architecture/authentication.md` and `documentation/apps/web.md`. |
| `apps/web/e2e/README.md`, `ENV_SETUP.md`, `E2E_TESTING_SUMMARY.md` | **Keep** | Accurate and colocated with the tests — colocated test docs are fine. Link from `documentation/getting-started/testing.md`. |
| `apps/web/components/features/marketing/CLAUDE.md` | **Keep** | Active policy enforced against lint config; referenced by `documentation/agents/conventions.md`. |
| `apps/web/.design-reference/` | **Delete** | Imported design chats; not documentation. |
| `apps/admin/README.md` | **Replace** | Pointer to `documentation/apps/admin.md`. |
| `apps/bff/README.md` | **Replace** | Pointer to `documentation/apps/bff.md`. |
| `apps/bff/ENDPOINTS_AUDIT.md` | **Delete** | Contains at least one false claim (`GET /api/profiles/me/favorites` marked missing; it exists). Endpoint truth is Swagger (`/api/docs`) + new domain docs. |
| `apps/bff/TESTING_UPDATES.md` | **Delete** | Historical refactor log. Its one live item (password-reset e2e gap) is tracked in [implementation-risks.md](implementation-risks.md) #2. |
| `apps/bff/docs/REDIS_MIGRATION_GUIDE.md` | **Delete** | Plan for unimplemented Redis; tracked as risks #9. Restore from git history if/when Redis happens. |
| `apps/bff/docs/PROFILE_WIRE_ALIGN_INVESTIGATION.md` | **Delete** | Closed investigation (its prescribed favorites endpoint exists now). |
| `apps/bff/src/database/seeds/README-*.md` | **Fold** | Verified content absorbed into `documentation/operations/seeds.md`; then delete or keep as colocated notes. |

## `packages/`

| Legacy | Fate | Replacement / notes |
|---|---|---|
| `packages/ui/ui-ux-bible.md` | **Keep** | Design authority; enforced by eslint-plugin-design; referenced throughout new docs. |
| `packages/ui/PLATFORM-UX.md` | **Keep** | Canonical component/journey list. |
| `packages/ui/ROADMAP.md` | **Fold → Delete** | Workstreams done except "apps audit + polish" (stale since 2026-04-24). Move the open item to the tracker, delete. |
| `packages/eslint-plugin-design/README.md` | **Keep** | Accurate package README. |
| `packages/shared/docs/nestjs-microservice-guide.md` | **Move or Delete with package** | Filename is legacy but content reflects the current single-BFF architecture (verified 2026-07-03). Its parent package `@welpco/shared` is unused (see implementation-risks #9b) — if the package is deleted, relocate anything still useful into `documentation/architecture/backend-overview.md` first. |

## Validation & removal process

1. **Validate** — a reviewer (human) spot-checks each `documentation/` file against the code, prioritizing: payment runbook, migrations, env vars, setup. Fix findings in place.
2. **Stage 1 removal** — delete the known-wrong docs first (`updated_functional_architecture/`, `ENDPOINTS_AUDIT.md`, `REDIS_MIGRATION_GUIDE.md`, `WEB-APP-PLAN.md`, boilerplate READMEs → pointers). These actively mislead.
3. **Stage 2 removal** — fold-then-delete items (root README rewrite, pwa/category docs, auth docs, seeds READMEs, features/ backlog triage).
4. **Stage 3** — move `docs/audit-*.md` into `documentation/improvements/audits/` and remove the then-empty `docs/`, `bible/`, `features/` directories.
5. Update `documentation/agents/README.md` once legacy trees are gone (it currently warns agents not to trust them).
