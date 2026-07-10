# @welpco/bff

NestJS backend-for-frontend — the single backend for the platform, with all 13 domains as modules (no microservices). Runs on **http://localhost:3000**, global prefix `/api`, Swagger at `/api/docs` (non-production only).

```bash
pnpm dev          # from this directory (requires Postgres — see setup guide)
```

Full documentation:
- [documentation/apps/bff.md](../../documentation/apps/bff.md) — scripts, ports, entry points
- [documentation/architecture/backend-overview.md](../../documentation/architecture/backend-overview.md) — module layout, auth, database
- [documentation/architecture/domains/](../../documentation/architecture/domains/README.md) — per-domain reference
- [documentation/operations/migrations.md](../../documentation/operations/migrations.md) · [seeds.md](../../documentation/operations/seeds.md) · [payment runbook](../../documentation/operations/payment-operations-runbook.md)
