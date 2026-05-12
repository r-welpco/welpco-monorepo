# Single Backend (BFF)

The **single NestJS backend** for the Welpco platform. It contains all domain logic as **modules** (user-management, profile-management, content-management, etc.). The frontend talks only to this app; there are no separate microservice processes or HTTP/Kafka calls to other services.

## Port

- **Backend**: Port 3000
- **Frontend**: Port 8081 in `apps/web` (or configurable)

## Architecture

```
Frontend (Next.js) → Single Backend (3000) — all domain modules in-process
```

- **Auth**, **Users**, **Profiles**, **Content** (and other domains) are **modules** inside this app.
- **Cache**: In-memory (no Redis).
- **Search**: PostgreSQL full-text + pg_trgm (no OpenSearch).
- **Communication**: Synchronous in-process (no Kafka).

## Setup

**Requirements**: PostgreSQL only (and optionally MailHog for local email testing). No Redis, Kafka, or OpenSearch.

1. **Create `.env.local`** (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
2. **Start PostgreSQL** (and optionally MailHog):
   ```bash
   docker-compose up -d
   ```
3. **Seed the database** (optional; creates test users and profiles):
   ```bash
   pnpm seed
   ```
   Or from the monorepo root: `pnpm seed:users`
4. **Start the backend**:
   ```bash
   pnpm dev
   ```

## Environment Variables

See `.env.example`. Key variables:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` — Single PostgreSQL database (default `welpco_dev`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — Auth
- `PORT` — Default 3000
- `FRONTEND_URL` — Production primary web origin for CORS
- `CORS_ORIGINS` — Optional comma-separated origins; if set, **only** these are allowed (use in production when web and admin are on different hosts). In **development**, if `CORS_ORIGINS` is unset, localhost ports **8080–8082** and **3000** are allowed together with `FRONTEND_URL` (so admin on 8082 works even when `FRONTEND_URL` points at the main app only).

No `REDIS_*`, `KAFKA_*`, or `OPENSEARCH_*`; cache is in-memory and communication is in-process.

## API Documentation

- **Swagger**: http://localhost:3000/api/docs
- **Admin**: `GET /api/admin/dashboard` returns a single aggregated snapshot (users, disputes, support tickets, bookings, payments). User moderation uses `PUT /api/admin/users/:id/status` with JSON `{ status, reasonCode?, reasonDetail? }` (reason required when status is Suspended or Deactivated).

## Modules

- **Auth**: Login, register, verify email, reset password, refresh token
- **Users**: Current user, update user
- **Profiles**: Profiles, onboarding, services, availability, favorites
- **Content**: Content management endpoints

All are implemented as domain modules within this app; no HTTP clients to separate services.

## Booking (MVP)

Late cancellations (within 24 hours of the scheduled start) are **logged only**; cancellation fees are not charged until product/Stripe rules are defined.
