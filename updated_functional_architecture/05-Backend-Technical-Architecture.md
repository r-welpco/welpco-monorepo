# 05 — Backend Technical Architecture

> **Status**: Current — reflects post-audit architecture decisions  
> **Last Updated**: April 2026  
> **Architecture Style**: Modular monolith (single NestJS backend with domain modules)

---

## 1. Architecture Philosophy

Welpco's backend follows a **"start simple, scale intentionally"** philosophy. Rather than prematurely adopting microservices, Kubernetes, or distributed messaging, we run all domain logic in a single NestJS process with clearly separated module boundaries. This approach:

- **Reduces operational overhead** — one deployment unit, one database, one log stream.
- **Preserves extractability** — each domain module has explicit interfaces that can be promoted to service boundaries when the need arises.
- **Accelerates iteration** — no network hops, no contract versioning, no distributed tracing complexity during the startup phase.

---

## 2. Technology Stack Summary

| Layer | Technology | Version / Notes |
|---|---|---|
| **Language** | TypeScript | 5.x (strict mode) |
| **Runtime** | Node.js | 22.x LTS |
| **Backend Framework** | NestJS | 11.x |
| **Frontend Framework** | Next.js | 16.x (App Router) |
| **Design System** | Storybook | Latest |
| **UI Components** | Radix UI | Headless primitives |
| **Database** | PostgreSQL | 16.x (Amazon RDS) |
| **ORM** | TypeORM | Latest (migrations only, `synchronize: false`) |
| **Search** | PostgreSQL full-text search | `pg_trgm` + GIN indexes |
| **Geocoding** | Google Maps Geocoding API | Abstracted via `IGeocodeService` |
| **Cache** | In-memory | NestJS `cache-manager` (no Redis) |
| **Message Queue** | None | Synchronous in-process calls |
| **Authentication** | JWT + Passport.js | `@nestjs/passport`, `@nestjs/jwt` |
| **Authorisation** | CASL | Ability-based permission model |
| **Security** | helmet | HTTP header hardening |
| **API Documentation** | Swagger / OpenAPI | Auto-generated at `/api/docs` |
| **Payment** | Stripe | **MVP** (platform account, manual capture; no Connect) |
| **Real-time** | Socket.io + NestJS | Planned (REST messaging exists) |
| **Notifications** | Email (SMTP / dev Mailhog); SES/SNS | **Partial** |
| **AI / ML** | Vercel AI SDK (chatbot) · Python + SageMaker (ML models) | Planned |
| **Monorepo** | Turborepo | Task orchestration and caching |
| **Cloud Provider** | AWS (optional) / any host | CDK in-repo is a **stub**; BFF runs as long-lived Node |
| **Compute** | ECS Fargate (target) or equivalent | BFF not suited to Vercel serverless (cron, Stripe webhooks) |
| **API Gateway** | AWS API Gateway (REST) | Optional front door in AWS deployment |
| **Monitoring** | CloudWatch + X-Ray + Sentry | Logs, traces, error tracking |
| **CI/CD** | GitHub Actions | Target; **not yet** in-repo — run `pnpm build` / `pnpm test` locally |
| **Testing** | Jest + Supertest + Playwright | Unit, integration, E2E |
| **Package Manager** | pnpm | Workspace protocol |

---

## 3. Architecture Decisions

### 3.1 Single Backend — No Microservices

**Decision**: All domain logic runs inside one NestJS application.

**Rationale**:
- The team is small; operational burden of microservices (networking, service discovery, distributed tracing, contract testing) outweighs the benefits at this stage.
- NestJS modules provide strong encapsulation. Each domain has its own module, service, controller, entities, and DTOs.
- Module boundaries are designed for future extraction — swapping an in-process call for an HTTP or gRPC call requires only a provider rebinding.

**Trade-off**: All domains share one deployment unit. A bug in one domain can affect the entire backend. Mitigated by comprehensive testing and staged rollouts.

### 3.2 PostgreSQL for Everything (Including Search)

**Decision**: Use PostgreSQL full-text search with `pg_trgm` and GIN indexes instead of a dedicated search engine (OpenSearch, Elasticsearch).

**Rationale**:
- Avoids a second data store and the associated synchronisation complexity.
- PostgreSQL full-text search handles the expected query volume comfortably at startup scale.
- `pg_trgm` provides fuzzy matching; `unaccent` handles diacritics; GIN indexes keep queries fast.
- If search requirements outgrow PostgreSQL, a dedicated engine can be introduced behind the existing service interfaces.

### 3.3 In-Memory Cache — No Redis

**Decision**: Use NestJS `cache-manager` with an in-memory store.

**Rationale**:
- At startup scale, a single instance serves all traffic. In-memory caching is sufficient and eliminates the Redis operational cost.
- The `cache-manager` abstraction allows a Redis adapter to be swapped in with zero application code changes when horizontal scaling begins.

### 3.4 No Message Queue — Synchronous Calls

**Decision**: Domain modules communicate via direct in-process method calls. No Kafka, RabbitMQ, or SQS.

**Rationale**:
- All modules run in the same process, so network overhead and eventual-consistency semantics are unnecessary.
- When asynchronous processing is needed (e.g., email sending), lightweight solutions like `Bull` with a Redis-backed queue can be introduced per use case.

### 3.5 Google Maps Geocoding (Abstracted)

**Decision**: Use Google Maps Geocoding API, abstracted behind an `IGeocodeService` interface.

**Rationale**:
- Google Maps provides accurate, global geocoding with good developer experience.
- The `IGeocodeService` interface decouples domain logic from the provider. Switching to Mapbox or another provider requires only a new implementation class and a module rebinding.
- An LRU cache and token-bucket rate limiter protect against quota overruns.

### 3.6 AWS with CDK (TypeScript)

**Decision**: AWS as cloud provider, all infrastructure defined with AWS CDK in TypeScript.

**Rationale**:
- CDK uses the same language as the application code, reducing context switching.
- Type-safe infrastructure definitions catch configuration errors at compile time.
- AWS provides the broadest service catalogue for future needs (SageMaker, SES, SNS, etc.).

### 3.7 JWT Authentication with CASL Permissions

**Decision**: Stateless JWT authentication via Passport.js; fine-grained permissions via CASL.

**Rationale**:
- Stateless tokens scale horizontally without a session store.
- CASL provides declarative, attribute-based access control that integrates natively with NestJS guards.
- The `@CurrentUser()` decorator provides a clean, testable way to access the authenticated user in controllers.

### 3.8 Migrations Only — No Synchronize

**Decision**: TypeORM `synchronize` is **disabled** in all environments. Schema changes go through migrations exclusively.

**Rationale**:
- `synchronize: true` can silently drop columns or alter types, causing data loss.
- Migrations are version-controlled, reviewable, and reversible.
- Migration files live in `database/migrations/` and run automatically on application startup (`migrationsRun: true`).

---

## 4. Project Structure

```
welpco-monorepo/
├── apps/
│   ├── bff/                          # NestJS backend (all domain modules)
│   │   ├── src/
│   │   │   ├── domains/              # Domain business logic
│   │   │   │   ├── user-management/
│   │   │   │   ├── profile-management/
│   │   │   │   ├── content-management/
│   │   │   │   ├── service-discovery/
│   │   │   │   ├── booking/
│   │   │   │   ├── payment/
│   │   │   │   ├── communication/
│   │   │   │   ├── review/
│   │   │   │   ├── dispute/
│   │   │   │   ├── notification/
│   │   │   │   └── geocode/
│   │   │   ├── modules/              # BFF API layer (controllers + DTOs)
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── profiles/
│   │   │   │   └── content/
│   │   │   ├── common/               # Cross-cutting (filters, interceptors, common/auth JWT)
│   │   │   ├── health/               # GET /api/health (+ PostgreSQL ping)
│   │   │   ├── database/             # TypeORM configuration
│   │   │   │   ├── migrations/
│   │   │   │   ├── seeds/
│   │   │   │   └── data-source.ts
│   │   │   ├── config/               # Environment config modules
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/                     # E2E tests
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Next.js 16 consumer app (App Router)
│   ├── admin/                        # Next.js 16 staff admin app
│   └── design-system/                # Storybook
│       ├── .storybook/
│       └── src/
│           └── stories/
│
├── packages/                         # Shared packages (consumed by apps)
│   ├── ui/                           # Shared UI components (Radix UI primitives)
│   ├── types/                        # Shared TypeScript type definitions
│   ├── shared/                       # Shared utility functions
│   ├── database/                     # Database base entity and utilities
│   └── events/                       # Event interfaces (for future async patterns)
│
├── infrastructure/                   # AWS CDK (placeholder stack — expand for RDS/ECS when used)
│   ├── lib/
│   └── bin/
│       └── infrastructure.ts
│
├── turbo.json                        # Turborepo pipeline configuration
├── pnpm-workspace.yaml               # pnpm workspace definition
├── package.json                      # Root package.json
└── tsconfig.base.json                # Base TypeScript configuration
```

---

## 5. Deployment Architecture

### 5.1 Target Environment

**Current product direction (April 2026):** deploy **Next.js** consumer web and staff **admin** to **Vercel**. Run the **BFF** on a long-lived Node host (same diagram’s ECS pattern, or Railway/Render/Fly) with a managed **PostgreSQL** database — the BFF uses **cron** (payment capture) and **Stripe webhooks**, which do not map cleanly to Vercel serverless functions alone.

```
┌──────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                                │
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────────┐  │
│  │   Route 53   │─────▶│ API Gateway  │─────▶│  ECS Fargate   │  │
│  │   (DNS)      │      │   (REST)     │      │                │  │
│  └─────────────┘      └──────────────┘      │  ┌──────────┐  │  │
│                                              │  │   BFF    │  │  │
│  ┌─────────────┐                             │  │ (NestJS) │  │  │
│  │  CloudFront  │──── Static assets ────┐    │  └──────────┘  │  │
│  │   (CDN)      │                       │    └───────┬────────┘  │
│  └─────────────┘                        │            │           │
│                                         │    ┌───────▼────────┐  │
│  ┌─────────────┐                        │    │   Amazon RDS   │  │
│  │   Vercel     │◀── Next.js (web) ─────┘    │  PostgreSQL    │  │
│  │  (Frontend)  │                             │   16.x         │  │
│  └─────────────┘                             └────────────────┘  │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐  │
│  │  CloudWatch  │    │   X-Ray     │    │       Sentry         │  │
│  │   (Logs)     │    │  (Traces)   │    │  (Error Tracking)    │  │
│  └─────────────┘    └─────────────┘    └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 ECS Fargate Configuration

| Parameter | Value |
|---|---|
| **Launch type** | Fargate |
| **CPU** | 512 (0.5 vCPU) — startup phase |
| **Memory** | 1024 MB — startup phase |
| **Desired count** | 2 (minimum for high availability) |
| **Auto-scaling** | Target tracking on CPU utilisation (70%) |
| **Health check** | `GET /api/health` (includes **PostgreSQL** connectivity check) |
| **Container image** | ECR private repository |
| **Secrets** | AWS Secrets Manager → ECS task definition environment |

### 5.3 Database (RDS)

| Parameter | Value |
|---|---|
| **Engine** | PostgreSQL 16.x |
| **Instance class** | `db.t4g.medium` — startup phase |
| **Multi-AZ** | Enabled (production) |
| **Storage** | gp3, 20 GB initial, auto-scaling to 100 GB |
| **Backup** | Automated, 7-day retention |
| **Encryption** | At rest (AES-256) and in transit (TLS) |

### 5.4 CI/CD Pipeline

```
Push to main
  │
  ▼
GitHub Actions
  ├── Lint + Type Check (Turborepo)
  ├── Unit Tests (Jest)
  ├── Integration Tests (Supertest)
  ├── E2E Tests (Playwright)
  ├── Build Docker Image
  ├── Push to ECR
  └── Deploy via CDK
       ├── Staging (automatic)
       └── Production (manual approval)
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
Client                     API Gateway              BFF (NestJS)
  │                            │                        │
  │── POST /api/auth/login ──▶│────── Forward ────────▶│
  │                            │                        │── Validate credentials
  │                            │                        │── Generate JWT (access + refresh)
  │◀── { accessToken } ───────│◀───── Response ────────│
  │                            │                        │
  │── GET /api/users (Bearer)─▶│────── Forward ────────▶│
  │                            │                        │── JwtAuthGuard validates token
  │                            │                        │── @CurrentUser() injects user
  │                            │                        │── PoliciesGuard checks CASL ability
  │◀── { data } ──────────────│◀───── Response ────────│
```

### 6.2 Security Checklist

| Control | Implementation | Status |
|---|---|---|
| HTTPS everywhere | API Gateway TLS termination | Active |
| HTTP security headers | `helmet` middleware | Active |
| JWT secret management | Required env var, no default, throws on missing | Active |
| Input validation | `ValidationPipe` with whitelist | Active |
| Permission model | CASL ability-based guards | Active |
| Rate limiting | `@nestjs/throttler` on sensitive routes | Active |
| CORS | Explicit origin allowlist | Active |
| SQL injection prevention | TypeORM parameterised queries | Active |
| Secrets storage | AWS Secrets Manager | Planned (deployment) |
| WAF | AWS WAF on API Gateway | Planned |
| Dependency scanning | GitHub Dependabot + `npm audit` | Planned |

---

## 7. Testing Strategy

| Level | Tool | Scope | Location |
|---|---|---|---|
| **Unit** | Jest | Services, utilities, pipes, guards | `*.spec.ts` alongside source |
| **Integration** | Supertest | Controller endpoints with database | `apps/bff/test/` |
| **E2E** | Playwright | Full user flows through the UI | `apps/web/e2e/` |
| **Component** | Storybook + Testing Library | UI component rendering and interaction | `apps/design-system/` |

### Testing Standards

- Minimum **80% code coverage** for domain services.
- All API endpoints have at least one integration test.
- Critical user journeys (registration, booking, payment) covered by E2E tests.
- Tests run in CI on every pull request; merges are blocked on failure.

---

## 8. Monitoring & Observability

| Concern | Tool | Detail |
|---|---|---|
| **Application logs** | CloudWatch Logs | Structured JSON via NestJS Logger |
| **Metrics** | CloudWatch Metrics | Custom metrics (request count, latency, error rate) |
| **Distributed tracing** | AWS X-Ray | Request tracing across API Gateway → ECS |
| **Error tracking** | Sentry | Unhandled exceptions with stack traces and context |
| **Uptime monitoring** | CloudWatch Synthetics | Canary checks on `/api/health` |
| **Alerts** | CloudWatch Alarms → SNS | P95 latency > 2s, error rate > 5%, CPU > 80% |

---

## 9. Implementation Phases

### Phase 1 — Foundation (Current)

- [x] NestJS backend with domain module structure
- [x] User management (registration, authentication, JWT)
- [x] Profile management (CRUD, search)
- [x] Content management (categories, pages)
- [x] Service discovery (PostgreSQL full-text search)
- [x] Geocoding (Google Maps with LRU cache)
- [x] Swagger API documentation
- [x] Global validation, error handling, logging
- [x] CASL-based permissions
- [x] Health endpoint with **database** ping (`/api/health`)
- [ ] Docker containerisation
- [ ] AWS CDK infrastructure stacks (full)
- [ ] CI/CD pipeline (GitHub Actions) in-repo

### Phase 2 — Core Features

- [x] Booking module (core lifecycle; recurring TBD)
- [ ] Job posting module (service marketplace)
- [x] Stripe payment integration (platform MVP; Connect/payouts TBD)
- [x] Email notifications (transactional SMTP; SES at scale TBD)
- [x] File upload (S3 pre-signed URLs)
- [x] Admin dashboard (BFF admin APIs + `@welpco/admin` Next app)

### Phase 3 — Engagement

- [x] In-app messaging (**REST**; Socket.io TBD)
- [ ] Push notifications (AWS SNS / FCM)
- [x] Review and rating system (core; moderation TBD)
- [ ] Advanced search filters and sorting
- [ ] Analytics and reporting endpoints

### Phase 4 — Intelligence

- [ ] AI chatbot (Vercel AI SDK)
- [ ] Service recommendation engine (Python + SageMaker)
- [ ] Demand prediction models
- [ ] Dynamic pricing suggestions
- [ ] Fraud detection

---

## 10. Scaling Strategy

The architecture is designed to scale incrementally without a rewrite:

| Trigger | Action |
|---|---|
| Single instance bottleneck | Scale ECS tasks horizontally (auto-scaling already configured) |
| In-memory cache misses across instances | Swap `cache-manager` store to Redis (ElastiCache) |
| Database read pressure | Add RDS read replicas; point read queries to replica |
| Search latency / advanced queries | Introduce OpenSearch behind existing service interfaces |
| Asynchronous workloads (email, PDF) | Add Bull queues with Redis for background jobs |
| Domain module independence needed | Extract module to its own NestJS service behind API Gateway |
| Global traffic | Add CloudFront caching; multi-region RDS with Global Database |

> Each scaling step is independent and does not require rearchitecting the entire system.

---

## Appendix A: Key Configuration Files

| File | Purpose |
|---|---|
| `turbo.json` | Turborepo pipeline (build, lint, test, dev tasks) |
| `pnpm-workspace.yaml` | Workspace package definitions |
| `apps/bff/src/database/data-source.ts` | TypeORM DataSource (migrations CLI) |
| `apps/bff/src/config/` | NestJS `ConfigModule` validation schemas |
| `infrastructure/bin/infrastructure.ts` | CDK app entry point |
| `.github/workflows/ci.yml` | GitHub Actions CI/CD pipeline |

## Appendix B: Decision Log

| # | Decision | Date | Status |
|---|---|---|---|
| 1 | Single NestJS backend (no microservices) | Jan 2026 | Accepted |
| 2 | PostgreSQL full-text search (no OpenSearch) | Jan 2026 | Accepted |
| 3 | In-memory cache (no Redis) | Jan 2026 | Accepted |
| 4 | Synchronous calls (no message queue) | Jan 2026 | Accepted |
| 5 | Google Maps Geocoding (abstracted) | Jan 2026 | Accepted |
| 6 | AWS CDK with TypeScript | Jan 2026 | Accepted |
| 7 | ECS Fargate (no Kubernetes) | Jan 2026 | Accepted |
| 8 | Migrations only (no synchronize) | Feb 2026 | Accepted |
| 9 | CASL for permissions (no custom RBAC) | Feb 2026 | Accepted |
| 10 | Stripe for payments | Feb 2026 | Planned |
