# Welpco Admin

Next.js admin console (default dev port **8082**).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | BFF base URL (e.g. `http://localhost:3000`). All `/api/*` requests go here with the admin JWT. |
| NextAuth variables | See [`auth.ts`](./auth.ts) / your deployment secrets for `AUTH_SECRET`, OAuth or credentials provider settings. |

## Production notes

- **CORS**: The BFF must allow this app’s origin. In development, `FRONTEND_URL` alone is not enough if the main app and admin use different ports; the BFF merges common localhost origins in dev. For production, set **`CORS_ORIGINS`** to a comma-separated list of every browser origin that calls the API (e.g. `https://app.example.com,https://admin.example.com`).
- **HTTPS**: Use secure cookies and correct `NEXTAUTH_URL` for the admin host.
- **Migration**: After deploying BFF changes, run DB migrations so `user_accounts` moderation columns exist (`pnpm` migration script in `apps/bff`).

## Scripts

- `pnpm dev` — `next dev -p 8082`
- `pnpm build` / `pnpm start` — production build and serve on 8082
