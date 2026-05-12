# 03-00 — BFF Domain (Single Backend API)

> **Status**: Current — aligned with monorepo implementation (April 2026)  
> **Runtime**: NestJS 11 · TypeScript 5.x · Node.js 22.x LTS  
> **Port**: 3000  
> **API Prefix**: `/api`  
> **Swagger**: `/api/docs`

---

## 1. Description

The Welpco backend is a **single NestJS application** that serves as the Backend-for-Frontend (BFF). All domain logic is implemented as **co-located NestJS modules** inside one process — there are no separate microservices, no message brokers, and no service mesh. Inter-domain communication is achieved through direct, synchronous in-process method calls.

This design keeps operational complexity minimal during the startup phase while preserving clear module boundaries that can be extracted into independent services later if scale demands it.

---

## 2. Architecture Flow

```
┌─────────────┐       HTTPS        ┌───────────────────────────────────────┐
│             │  ─────────────────▶ │  NestJS Application (port 3000)      │
│  Next.js    │                     │                                       │
│  (web/admin)│                     │  ┌─────────────────────────────────┐  │
│  apps/web   │  ◀───────────────── │  │  Global Middleware              │  │
│  + admin    │                     │  │                                 │  │
│             │       JSON          │  │  ● helmet                       │  │
└─────────────┘                     │  │  ● ValidationPipe               │  │
                                    │  │  ● HttpExceptionFilter          │  │
                                    │  │  ● LoggingInterceptor           │  │
                                    │  └──────────┬──────────────────────┘  │
                                    │             │                         │
                                    │  ┌──────────▼──────────────────────┐  │
                                    │  │  BFF API Layer (modules/)       │  │
                                    │  │  ● AuthModule                   │  │
                                    │  │  ● UsersModule                  │  │
                                    │  │  ● ProfilesModule               │  │
                                    │  │  ● ContentModule                │  │
                                    │  └──────────┬──────────────────────┘  │
                                    │             │  in-process calls       │
                                    │  ┌──────────▼──────────────────────┐  │
                                    │  │  Domain Modules (domains/)      │  │
                                    │  │  ● UserManagementModule         │  │
                                    │  │  ● ProfileManagementModule      │  │
                                    │  │  ● ContentManagementModule      │  │
                                    │  │  ● ServiceDiscoveryModule       │  │
                                    │  │  ● BookingModule                │  │
                                    │  │  ● PaymentModule                │  │
                                    │  │  ● CommunicationModule          │  │
                                    │  │  ● ReviewModule                 │  │
                                    │  │  ● DisputeModule                │  │
                                    │  │  ● NotificationModule           │  │
                                    │  │  ● GeocodeModule                │  │
                                    │  └──────────┬──────────────────────┘  │
                                    │             │                         │
                                    │  ┌──────────▼──────────────────────┐  │
                                    │  │  PostgreSQL (TypeORM)           │  │
                                    │  └─────────────────────────────────┘  │
                                    └───────────────────────────────────────┘
```

### Request Lifecycle

1. **Frontend** sends an HTTP request to the BFF (`/api/...`).
2. **Global middleware** applies security headers (helmet), parses the body, and attaches request metadata.
3. **Guards** authenticate the request via JWT (Passport.js) and authorise it via CASL permissions.
4. **ValidationPipe** validates and transforms the DTO using `class-validator` / `class-transformer` (whitelist mode strips unknown properties).
5. **Controller** in the BFF API layer delegates to the appropriate **domain service** via a direct in-process call.
6. **Domain service** executes business logic, interacts with the **database** through TypeORM repositories, and returns the result.
7. **LoggingInterceptor** logs the request/response cycle.
8. **HttpExceptionFilter** catches any unhandled exceptions and returns a standardised error response.
9. **Response** is serialised to JSON and sent back to the frontend.

---

## 3. Implemented Domain Modules

| Module | Location | Status | Purpose |
|---|---|---|---|
| **User Management** | `domains/user-management/` | Active | Registration, JWT auth, admin, audit, referrals |
| **Profile Management** | `domains/profile-management/` | Active | Welper/customer profiles, offerings, availability, favorites |
| **Content Management** | `domains/content-management/` | Active | Categories, questions, static content, holidays |
| **Service Discovery** | `domains/service-discovery/` | Active | Search, filtering, PostgreSQL full-text + geo |
| **Booking** | `domains/booking/` | Active | Full core lifecycle (accept/decline, check-in/out, receipt, cancel) |
| **Payment** | `domains/payment/` | Active (MVP) | Stripe platform: SetupIntent, manual capture, webhooks, capture scheduler |
| **Communication** | `domains/communication/` | Partial | Booking-scoped threads/messages (REST), inbox |
| **Review** | `domains/review/` | Partial | Post-completion reviews, welper aggregate rating |
| **Dispute** | `domains/dispute/` | Partial | Filing, admin resolution, booking/payment coordination |
| **Notification** | `domains/notification/` | Partial | Transactional email (booking events); SMS/push TBD |
| **Geocode** | `domains/geocode/` | Active | Address geocoding via Google Maps API |
| **Health** | `health/` | Active | `GET /api/health` — process + **PostgreSQL ping** (Terminus) |

**Auth (JWT, guards, strategies)** lives in **`apps/bff/src/common/auth`** (no separate `@welpco/auth` workspace package).

---

## 4. API Endpoints Summary

All endpoints are prefixed with `/api`.

### Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Authenticate and receive JWT |
| `POST` | `/auth/refresh` | Bearer | Refresh an expired access token |
| `GET` | `/auth/me` | Bearer | Get the current authenticated user |

### Users (`/api/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all users (paginated) |
| `GET` | `/users/:id` | Bearer | Get a user by ID |
| `PATCH` | `/users/:id` | Owner/Admin | Update user details |
| `DELETE` | `/users/:id` | Admin | Soft-delete a user |

### Profiles (`/api/profiles`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles` | Public | List/search profiles |
| `GET` | `/profiles/:id` | Public | Get a profile by ID |
| `POST` | `/profiles` | Bearer | Create a profile |
| `PATCH` | `/profiles/:id` | Owner/Admin | Update a profile |

### Content (`/api/content`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/categories` | Public | List service categories |
| `GET` | `/content/pages/:slug` | Public | Get a content page by slug |
| `POST` | `/content/categories` | Admin | Create a category |
| `PATCH` | `/content/categories/:id` | Admin | Update a category |

### Service Discovery (`/api/services`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/services` | Public | Search/filter services |
| `GET` | `/services/:id` | Public | Get service details |

### Geocoding (`/api/geocode`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/geocode` | Bearer | Geocode an address string |
| `GET` | `/geocode/reverse` | Bearer | Reverse-geocode coordinates |

> Full endpoint documentation is auto-generated and available at **`/api/docs`** (Swagger UI).

### Health (`/api/health`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Liveness + **database connectivity** (`TypeOrmHealthIndicator.pingCheck`) |

---

## 5. Authentication & Security

### JWT Authentication

- **Strategy**: Passport.js JWT strategy (`@nestjs/passport`).
- **Token format**: Signed JWT containing `sub` (user ID), `email`, and `roles`.
- **Guard**: `JwtAuthGuard` applied globally or per-route.
- **User injection**: Controllers access the authenticated user through the **`@CurrentUser()` parameter decorator** — manual token extraction from headers is never used.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: UserEntity) {
  return user;
}
```

### Authorisation (CASL)

- Permissions are defined per role using **CASL ability factories**.
- The `@CheckPolicies()` decorator and `PoliciesGuard` enforce fine-grained access control at the handler level.

### Security Hardening

| Measure | Implementation |
|---|---|
| HTTP headers | `helmet` middleware (CSP, HSTS, X-Frame-Options, etc.) |
| Secret management | `JWT_SECRET` is **required** — the application throws on startup if the variable is missing or empty. There is no default secret. |
| Input validation | `ValidationPipe` with `whitelist: true` strips undeclared properties; `forbidNonWhitelisted` can be enabled per-route. |
| Rate limiting | `@nestjs/throttler` applied to sensitive endpoints (auth, geocode). |
| CORS | Configured via `app.enableCors()` with an explicit origin allowlist. |

---

## 6. Database

| Property | Value |
|---|---|
| **Engine** | PostgreSQL 16.x |
| **ORM** | TypeORM |
| **Connection** | Single database, single connection pool |
| **Schema management** | **Migrations only** — `synchronize` is **disabled** in all environments |
| **Seeding** | Custom seed scripts in `database/seeds/` |
| **Extensions** | `pg_trgm`, `unaccent` (for full-text search) |

### Connection Configuration

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_DATABASE'),
    autoLoadEntities: true,
    synchronize: false,    // NEVER true — use migrations
    migrationsRun: true,
    migrations: ['dist/database/migrations/*.js'],
  }),
  inject: [ConfigService],
});
```

---

## 7. Geocoding

The Geocode module provides address-to-coordinate resolution and reverse geocoding for service discovery and profile location features.

### Implementation Details

| Aspect | Detail |
|---|---|
| **Provider** | Google Maps Geocoding API |
| **Abstraction** | `IGeocodeService` interface — implementations are swappable (e.g., Mapbox) |
| **Caching** | LRU in-memory cache (configurable TTL and max size) to reduce API calls |
| **Rate limiting** | Token-bucket rate limiter to stay within Google Maps API quotas |
| **Fallback** | Returns `null` coordinates with a warning log if the provider is unavailable |

### Interface Contract

```typescript
interface IGeocodeService {
  geocode(address: string): Promise<GeocodeResult | null>;
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null>;
}
```

To swap providers, implement `IGeocodeService` and rebind the injection token in `GeocodeModule`. No changes to consuming modules are required.

---

## 8. Global Features

### ValidationPipe

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,          // Strip properties not in DTO
    transform: true,          // Auto-transform payloads to DTO instances
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### HttpExceptionFilter

Catches all `HttpException` instances and returns a consistent error envelope:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"],
  "timestamp": "2026-02-05T12:00:00.000Z",
  "path": "/api/auth/register"
}
```

### LoggingInterceptor

Logs every request with method, URL, status code, and response time. Uses NestJS `Logger` so output is structured and environment-aware.

---

## 9. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **Yes** | *(none — throws)* | Secret key for signing JWTs |
| `JWT_EXPIRATION` | No | `3600s` | Access token TTL |
| `GOOGLE_MAPS_API_KEY` | **Yes** | *(none)* | Google Maps Geocoding API key |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USERNAME` | Yes | — | PostgreSQL user |
| `DB_PASSWORD` | Yes | — | PostgreSQL password |
| `DB_DATABASE` | Yes | — | PostgreSQL database name |
| `PORT` | No | `3000` | Application listen port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `CORS_ORIGINS` | No | `http://localhost:3001` | Comma-separated allowed origins |
| `THROTTLE_TTL` | No | `60` | Rate-limit window (seconds) |
| `THROTTLE_LIMIT` | No | `10` | Max requests per window |

---

## 10. Future Domain Modules

The following are **not yet** full product domains in the BFF (or remain incomplete vs the functional spec). All continue to ship as **NestJS modules in the same app** when built.

| Module | Priority | Description |
|---|---|---|
| **Job Posting** | High | Post, browse, apply, award — UI stubs only today |
| **Safety & Verification** | High | Third-party ID/background products; admin background-check field exists |
| **Communication** | Medium | Real-time (Socket.io), attachments, moderation |
| **Review & Rating** | Medium | Moderation, welper replies, flags |
| **Notification** | Medium | SMS, push, preferences product, SES at scale |
| **Analytics** | Low | Platform metrics and reporting dashboards |
| **AI/ML** | Planned | Recommendations, chatbot, demand prediction |

Each module follows the same pattern:

```
domains/<module-name>/
├── <module-name>.module.ts
├── <module-name>.service.ts
├── <module-name>.controller.ts
├── entities/
├── dto/
├── interfaces/
└── __tests__/
```

---

## Appendix: Module Dependency Graph

```
AuthModule
  └─▶ UserManagementModule

ProfileManagementModule
  └─▶ UserManagementModule
  └─▶ GeocodeModule

ServiceDiscoveryModule
  └─▶ ContentManagementModule
  └─▶ ProfileManagementModule
  └─▶ GeocodeModule

BookingModule
  └─▶ UserManagementModule
  └─▶ ServiceDiscoveryModule
  └─▶ NotificationModule
  └─▶ PaymentModule

CommunicationModule
  └─▶ BookingModule

PaymentModule
  └─▶ (booking entities / services for holds, capture, webhooks)
```

> All dependencies are resolved through NestJS dependency injection. No circular dependencies exist.
