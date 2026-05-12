# Welpco Monorepo

The monorepo for the Welpco platform: a **NestJS backend** + **Next.js web app** + shared packages and infrastructure.

## Project Structure

```
welpco-monorepo/
├── apps/
│   ├── bff/                          # NestJS backend (all domain modules)
│   │   └── src/
│   │       ├── domains/              # Domain modules (DDD)
│   │       │   ├── user-management/  # Auth, users, referrals, email
│   │       │   ├── profile-management/ # Profiles, offerings, availability
│   │       │   ├── content-management/ # Categories, questions, static content
│   │       │   ├── service-discovery/  # Search (full-text + pg_trgm)
│   │       │   ├── booking/          # Booking requests
│   │       │   └── geocode/          # Google Maps geocoding
│   │       ├── modules/              # BFF API layer (auth, users, profiles, content)
│   │       ├── common/               # Guards, interceptors, filters, decorators
│   │       └── database/             # TypeORM config, seeds, migrations
│   ├── web/                          # Next.js 16 frontend
│   └── design-system/                # Storybook design system
├── packages/
│   ├── ui/                           # Shared UI components (Radix UI)
│   ├── shared/                       # Shared utilities
│   ├── types/                        # Shared TypeScript types
│   ├── database/                     # Database base entity, config
│   ├── events/                       # Event interfaces
│   └── auth/                         # Auth utilities
└── infrastructure/                   # AWS CDK
```

## Prerequisites

- **Node.js**: 22.x LTS or higher
- **pnpm**: 9.0.0 or higher
- **Docker** + **Docker Compose**: Latest version

## Local development (first time)

From the `welpco-monorepo` directory:

1. **Automated setup (recommended)**  
   Starts PostgreSQL and MailHog, installs dependencies, creates env files when missing, runs **all** TypeORM migrations, then seeds dev data.

   ```bash
   pnpm setup
   ```

2. **Start the platform**

   ```bash
   pnpm dev
   ```

   This runs the BFF and the main web app together (`turbo` filters `@welpco/web` + `@welpco/bff`).

3. **Open the apps**

   - Web: [http://localhost:8081](http://localhost:8081) (port is set in `apps/web/package.json`)
   - API + Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - MailHog: [http://localhost:8025](http://localhost:8025)

### What setup does (checklist)

| Step | What runs |
|------|-----------|
| Docker | `docker-compose up -d` — Postgres 16 (`welpco_dev`) + MailHog |
| DB extensions | `scripts/init-db.sh` — `uuid-ossp`, `pg_trgm` |
| Dependencies | `pnpm install` |
| BFF env | `apps/bff/.env.local` from `apps/bff/.env.example` if missing; ensures non-empty `GOOGLE_MAPS_API_KEY` |
| Web env | `apps/web/.env.local` from `apps/web/.env.example` if missing |
| Migrations | `pnpm db:migrate` → `apps/bff/src/database/run-migrations.ts` (full ordered chain, including user tables + profile/content/booking/payment) |
| Seed | `pnpm seed:users` → `apps/bff/src/database/seeds/run-seed.ts` (users, profiles, content, holidays, search demo data) |

### Manual setup (same outcome as `pnpm setup`)

If you prefer not to use the script:

```bash
pnpm install
docker-compose up -d
# Wait until Postgres is healthy, then:
cp apps/bff/.env.example apps/bff/.env.local
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate
pnpm seed:users
pnpm dev
```

**Environment notes**

- **BFF**: `GOOGLE_MAPS_API_KEY` must be non-empty or Nest will exit on boot (`GoogleMapsGeocodeService`). The example file uses `local-dev-placeholder` so the app starts; use a real [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com) key for address/postal features.
- **Web**: `NEXTAUTH_SECRET` and `NEXT_PUBLIC_API_URL` come from `apps/web/.env.example`; adjust for your machine if needed.
- **Stripe**: Optional for basic browsing; payment flows need `STRIPE_*` on the BFF and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on the web app.

### Test accounts (after seed)

| Role | Email | Password |
|------|--------|----------|
| Customer | `customer@welpco.com` | `Customer123!` |
| Welper | `welper@welpco.com` | `Welper123!` |
| Admin (staff) | `admin@welpco.local` | `Admin123!` |

E2E-oriented accounts (`e2e-customer@welpco.com`, `e2e-welper@welpco.com`) are also created with onboarding completed.

### Admin app (optional)

```bash
pnpm dev:admin
```

Admin Next.js runs on **8082** by default; the BFF allows localhost CORS for 8080–8082 when `CORS_ORIGINS` is unset in development.

## Service Ports

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |
| Web | http://localhost:8081 |
| Admin | http://localhost:8082 |
| Storybook | http://localhost:6006 |
| PostgreSQL | localhost:5432 |
| MailHog (web) | localhost:8025 |

## Development Workflow

1. Start Docker: `docker-compose up -d`
2. After pulling new code: `pnpm db:migrate` then `pnpm seed:users` if seeds changed (seed is safe to re-run; it upserts test users)
3. Start apps: `pnpm dev`
4. Backend and web hot-reload during development

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | NestJS 11, TypeORM, TypeScript |
| Database | PostgreSQL 16.6 |
| Search | PostgreSQL full-text + pg_trgm |
| Geocoding | Google Maps Geocoding API |
| Auth | JWT (Passport.js) + NextAuth.js v5 |
| UI | Radix UI Themes |
| State | TanStack React Query + Zustand |
| Monorepo | Turborepo + pnpm workspaces |
| Infrastructure | AWS CDK |

## Commands

```bash
pnpm setup          # Docker + install + migrate + seed + env scaffolding
pnpm dev            # BFF + web
pnpm dev:admin      # BFF + admin
pnpm build          # Build all
pnpm test           # Run all tests
pnpm lint           # Lint all code
pnpm type-check     # Type check all code
pnpm db:migrate     # Run TypeORM migrations (BFF)
pnpm seed:users     # Seed dev data (BFF)
```

## Troubleshooting

**Port already in use:**

```bash
lsof -i :3000
lsof -i :8081
```

**Docker services not starting:**

```bash
docker-compose logs
```

**Clean database volume (wipe all local data) and start over:**

```bash
docker-compose down -v
docker-compose up -d
pnpm db:migrate
pnpm seed:users
```

**Dependencies issues:**

```bash
pnpm clean && pnpm install
```
