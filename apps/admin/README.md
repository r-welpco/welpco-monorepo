# Welpco Admin

Next.js staff console (default dev port **8082**). **Launch slice** UI uses [`@welpco/ui`](../../packages/ui) + Radix Themes (dark). Other routes (bookings, disputes, CMS, etc.) still use legacy CSS until migrated.

## Environment

Copy [`.env.example`](./.env.example) to `.env.local` and adjust values.

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | BFF base URL (e.g. `http://localhost:3000`). All `/api/*` requests use the admin JWT. |
| `NEXTAUTH_SECRET` | Yes | Session signing — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical admin URL (e.g. `http://localhost:8082` or `https://admin.example.com`) |

Auth.js v5 may also accept `AUTH_SECRET` / `AUTH_URL` as aliases; this app reads `NEXTAUTH_*` in [`auth.ts`](./auth.ts).

## Scripts

- `pnpm dev` — from monorepo root: `pnpm dev:admin` (admin + BFF)
- `pnpm build` / `pnpm start` — production build on port 8082

Build order (CI / local):

```bash
pnpm --filter @welpco/ui build
pnpm --filter @welpco/admin build
```

## Production checklist (launch deploy)

1. Set `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` on the admin host (Vercel env). For monorepo deploys with Turborepo, these are listed in root [`turbo.json`](../../turbo.json) `globalEnv` so Vercel passes them into `turbo run build`.
2. Add the admin origin to BFF **`CORS_ORIGINS`** (comma-separated).
3. Run BFF DB migrations (`admin_audit_logs`, user moderation columns, etc.).
4. Create at least one admin user (`pnpm create:admin` against the same DB the BFF uses).
5. Smoke: login → Dashboard → Users → user detail → Audit log.

## Launch navigation

Dashboard, Users, and Audit (see [`lib/admin-nav.ts`](./lib/admin-nav.ts)). Other modules remain reachable by direct URL with legacy styling.

## Notes

- **CORS**: In development the BFF allows common localhost ports; production requires explicit `CORS_ORIGINS`.
- **HTTPS**: Use `NEXTAUTH_URL` with `https://` in production; `trustHost: true` is enabled in auth config for Vercel.
