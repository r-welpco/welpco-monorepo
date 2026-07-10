# @welpco/admin

Admin dashboard (Next.js). Runs on **http://localhost:8082**. Admin-role accounts only. Launch-slice routes use `@welpco/ui` + Radix Themes (dark); older routes still use legacy CSS until migrated.

```bash
pnpm dev          # from this directory, or `pnpm dev:admin` from the repo root
```

Environment: copy [`.env.example`](./.env.example) to `.env.local` — variables are documented in [documentation/operations/environment-variables.md](../../documentation/operations/environment-variables.md).

Full documentation: [documentation/apps/admin.md](../../documentation/apps/admin.md) — dashboard sections, auth gating, service layer → BFF endpoints.
