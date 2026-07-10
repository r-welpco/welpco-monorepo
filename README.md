# Welpco

Services marketplace platform: customers find, book, and pay **welpers** (service providers) for local services — with payments, payouts, disputes, reviews, messaging, and safety verification built in.

## Quick start

```bash
pnpm install
./scripts/setup-dev.sh   # starts Postgres + MailHog (Docker), creates .env files, runs migrations + seeds
pnpm dev                 # BFF (:3000) + web (:8081)
```

Full setup guide: [documentation/getting-started/setup.md](documentation/getting-started/setup.md)

## What's in this repo

| | Path | Port |
|---|---|---|
| Customer web app (Next.js) | `apps/web` | 8081 |
| Admin app (Next.js) | `apps/admin` | 8082 |
| Backend-for-frontend (NestJS, all domains) | `apps/bff` | 3000 · Swagger at `/api/docs` |
| Storybook (design system) | `apps/design-system` | 6006 |
| Shared packages (`ui`, `types`, `email`, …) | `packages/` | — |

## Documentation

**All documentation lives in [`documentation/`](documentation/README.md)** — generated from the implementation and verified against the code. Start there.

- New here? [Getting started](documentation/getting-started/setup.md) → [repository structure](documentation/getting-started/repository-structure.md)
- Backend: [overview](documentation/architecture/backend-overview.md) · [domain docs](documentation/architecture/domains/README.md)
- Operating payouts: [payment operations runbook](documentation/operations/payment-operations-runbook.md)
- AI coding agents: [documentation/agents/](documentation/agents/README.md)
- Known risks & backlog: [documentation/improvements/](documentation/improvements/README.md)

Design authorities (referenced throughout): `packages/ui/ui-ux-bible.md` and `packages/ui/PLATFORM-UX.md`.
