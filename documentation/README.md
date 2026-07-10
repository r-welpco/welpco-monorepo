# Welpco Platform Documentation

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

This is the **authoritative documentation tree** for the welpco monorepo, generated directly from the code — every file states what it was verified against. The legacy doc trees (`updated_functional_architecture/`, `features/`, `bible/`, `docs/`, scattered app READMEs) are superseded and scheduled for removal; see [improvements/documentation-cleanup.md](improvements/documentation-cleanup.md). **When docs and code disagree, the code wins — fix the doc.**

Two legacy documents remain authoritative and are referenced from here: `packages/ui/ui-ux-bible.md` (design rules) and `packages/ui/PLATFORM-UX.md` (canonical components & journeys).

## Getting started

| Doc | Contents |
|---|---|
| [getting-started/setup.md](getting-started/setup.md) | Prerequisites, Docker services (Postgres 16.6, MailHog), `setup-dev.sh` walkthrough, env files, ports table |
| [getting-started/repository-structure.md](getting-started/repository-structure.md) | The real layout: 4 apps, 7 packages, scripts, infrastructure (CDK placeholders) |
| [getting-started/development-workflow.md](getting-started/development-workflow.md) | Every root/app script, Turbo pipeline, how apps connect in dev |
| [getting-started/testing.md](getting-started/testing.md) | BFF Jest unit + e2e, web Playwright, required env, known gaps |

## Architecture

| Doc | Contents |
|---|---|
| [architecture/backend-overview.md](architecture/backend-overview.md) | NestJS BFF: module layout, auth stack, TypeORM + migration runner, Swagger, caching, cross-domain communication |
| [architecture/authentication.md](architecture/authentication.md) | End-to-end auth: BFF JWT (15m/7d, `authVersion` revocation), web/admin NextAuth v5, Turnstile, signup→login→refresh flows |
| [architecture/domains/README.md](architecture/domains/README.md) | Index of all 13 backend domains |
| [architecture/domains/payment.md](architecture/domains/payment.md) | Deepest domain doc: entities & enums, hold→capture→release→ledger→Friday-batch lifecycle, Stripe, migrations, admin endpoints |
| [architecture/domains/booking.md](architecture/domains/booking.md) | Booking state machine (9 statuses, verified transition table), payment touch points |
| …plus [11 more domain docs](architecture/domains/) | user-management, profile-management, service-discovery, job-posting, communication, notification, safety-verification, content-management, geocode, dispute, review |

## Apps & packages

| Doc | Contents |
|---|---|
| [apps/web.md](apps/web.md) | Customer app (Next.js, :8081): routes, API client, PWA, marketing-folder policy |
| [apps/admin.md](apps/admin.md) | Admin app (:8082): 17 dashboard sections, admin-only auth gating, service layer → BFF endpoints |
| [apps/bff.md](apps/bff.md) | Backend-for-frontend (:3000) pointer doc + scripts |
| [apps/design-system.md](apps/design-system.md) | Storybook host (:6006) for `@welpco/ui` |
| [packages/](packages/) | One doc per package: ui, database, shared, types, events, email, eslint-plugin-design — including which are vestigial |

## Operations

| Doc | Contents |
|---|---|
| [operations/payment-operations-runbook.md](operations/payment-operations-runbook.md) | Payout batch lifecycle (incl. the reserved `approved` status and Friday unique index), admin operations, cron, failure recovery, troubleshooting |
| [operations/migrations.md](operations/migrations.md) | How migrations are discovered/ordered/run, skeleton, gaps (no rollback invocation, no prod automation) |
| [operations/environment-variables.md](operations/environment-variables.md) | Verified env var tables per app + known `.env.example` errors |
| [operations/seeds.md](operations/seeds.md) | Seed scripts, order, guard flags |
| [operations/deployment.md](operations/deployment.md) | Current reality: no CI/CD or deploy automation exists — what a manual deploy requires |

## For AI agents

| Doc | Contents |
|---|---|
| [agents/README.md](agents/README.md) | Orientation, read order, source-of-truth rule, before-you-edit checklist |
| [agents/codebase-map.md](agents/codebase-map.md) | Fast map: apps, packages, domains, ports, key locations |
| [agents/conventions.md](agents/conventions.md) | Design-lint rules, NestJS patterns, migration naming, test layout |
| [agents/guardrails.md](agents/guardrails.md) | Money paths, append-only migrations, Friday index constraint, things not to do |
| [agents/common-tasks.md](agents/common-tasks.md) | Recipes with real example files: endpoint, migration, UI component, seed, local stack |

## Improvements & risks

| Doc | Contents |
|---|---|
| [improvements/implementation-risks.md](improvements/implementation-risks.md) | Prioritized code/tooling/process risks found in the 2026-07-03 audit (P0–P3) |
| [improvements/documentation-cleanup.md](improvements/documentation-cleanup.md) | Legacy-doc → replacement mapping and the staged removal plan |

## Maintaining this tree

- Every file carries a `Last verified` header — update it when you re-verify or change a doc.
- Docs describe **what exists**, not plans. Plans and open risks belong in `improvements/` or the issue tracker.
- When changing a domain's entities, endpoints, or status enums, update its doc in `architecture/domains/` in the same PR (the payment runbook likewise for payout changes).
