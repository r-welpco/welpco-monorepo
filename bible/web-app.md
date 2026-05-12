# Web Application Bible — Welpco

> **Version**: 3.0.0 · **Updated**: 2026-03
> **Audience**: AI agents and developers working on the Welpco web app and BFF

---

## 1. Architecture

### Stack (pinned versions)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.0.5 |
| UI library | React | 19.2.0 |
| Language | TypeScript | 5 |
| Design system | Radix UI Themes | 3.2.1 |
| Server state | TanStack React Query | 5.62.11 |
| Client state | Zustand | 5.0.2 |
| Forms | React Hook Form + Zod | 7.54 / 3.24 |
| Auth | NextAuth.js v5 beta | 5.0.0-beta.25 |

> **No Tailwind CSS.** All styling uses Radix Themes props, tokens, and `style` objects.

### Two-tier architecture

```
Frontend (Next.js, :8081) ─── HTTP/JSON ──→ BFF (NestJS 11 monolith, :3000) ──→ PostgreSQL 16.6
```

- **No microservices.** The BFF is a single NestJS monolith that owns all business logic.
- Frontend **never** talks to the database directly.
- `NEXT_PUBLIC_API_URL` always points to the BFF (`http://localhost:3000`).

### Principles

- Server Components by default; add `'use client'` only for interactivity.
- Server state → React Query. Client state → Zustand. Never mix.
- All API calls go through `apiClient` → BFF. No direct DB or service calls.
- See `bible/ui-ux.md` for all design-system rules.

---

## 2. API Client

**Source**: `apps/web/lib/api/client.ts`

### Behavior summary

| Concern | Behavior |
|---|---|
| Base URL | `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) |
| Auth header | `Bearer <accessToken>` added automatically unless `skipAuth: true` |
| Query params | `params?: Record<string, string \| number \| boolean \| undefined>` — `undefined`/`null` values are silently dropped |
| 401 handling | **Does NOT retry.** Calls `clearTokenCache()` from `get-token.ts`, throws `ApiClientError("Session expired", 401)` |
| Token fetch | `get-token.ts` caches `getSession()` result for 5 seconds to avoid repeated round-trips |
| Methods | `get`, `post`, `put`, `patch`, `delete` — all generic `<T>` |

### Key design decisions

1. **No retry on 401** — the NextAuth JWT callback already attempted a refresh before the request ran.
2. `clearTokenCache()` invalidates the 5-second session cache so the next request forces a fresh `getSession()`.
3. Client-side `getSession()` vs server-side `auth()` — `get-token.ts` handles both environments.

---

## 3. Authentication

**Source**: `apps/web/lib/auth/config.ts`

### JWT-only, no server-side sessions

NextAuth stores everything in a JWT cookie — no database session table.

### Token refresh — promise-based dedup

When `accessTokenExpires` is within 60 seconds, the `jwt` callback triggers a refresh:

1. A single `refreshPromise` is stored on `globalThis.__refreshPromise`.
2. All concurrent JWT callbacks await the **same** promise — no stampede.
3. The promise is cleared in `finally`.

### Three refresh outcomes

| Outcome | Condition | Effect |
|---|---|---|
| **Success** | 200 response with `accessToken` | Update `token.accessToken`, reset expiry to +15 min |
| **Invalidation** | 401 or 403 from BFF | Clear all token fields → user treated as signed out |
| **Network error** | fetch throws or other status | Keep existing token as-is (graceful degradation) |

### Session invalidation guard

The `session` callback returns `{ accessToken: undefined, user: undefined }` when `!token?.accessToken || !token?.id`, preventing stale sessions from reaching components.

### Login flow

```
POST /api/auth/login → BFF validates credentials, returns { accessToken, refreshToken, user }
→ NextAuth stores tokens in JWT cookie
→ Redirect to /dashboard
```

---

## 4. State Management

### Server state — React Query

**Location**: `apps/web/lib/hooks/`

All data from the BFF goes through React Query hooks (e.g., `useCustomerProfile`, `useWelperProfile`). This provides automatic caching, loading/error states, background refetch, and cache invalidation on mutations.

### Client state — Zustand stores

**Location**: `apps/web/stores/`

| Store | Key state |
|---|---|
| `authStore.ts` | `user`, `isAuthenticated`, `isLoading`. Selectors: `useUser`, `useIsAuthenticated`. **Caveat**: this is a client-side mirror — source of truth is the NextAuth session. |
| `userStore.ts` | Multi-flow: registration data, verification state, password reset state, onboarding step/progress. |
| `uiStore.ts` | `sidebarOpen`, `toggleSidebar`. |
| `personalizationStore.ts` | `themeMode`, `translucentTheme`, `backgroundId`, `shapeId`. Persisted to localStorage (`welpco-personalization`). |
| `profileStore.ts` | **Deprecated.** Empty file. All profile data lives in React Query hooks. |

### Anti-pattern

```typescript
// ❌ Manual useState + useEffect for server data
const [data, setData] = useState(null);
useEffect(() => { fetchData().then(setData); }, []);

// ✅ React Query
const { data } = useQuery({ queryKey: ['x'], queryFn: fetchData });
```

---

## 5. BFF Integration

### Architecture — NestJS 11 monolith

The BFF is **not** a proxy to microservices. It is a monolith that directly owns all business logic and database access via TypeORM.

**Source**: `apps/bff/src/domains/`

### Domain modules

| Domain | Path | Purpose |
|---|---|---|
| user-management | `domains/user-management/` | Auth, users, admin, guardian, referrals |
| profile-management | `domains/profile-management/` | Customer/welper profiles, availability, service offerings, favorites |
| booking | `domains/booking/` | Booking requests and lifecycle |
| communication | `domains/communication/` | Booking-scoped chat (threads, messages) |
| content-management | `domains/content-management/` | Categories, questions, static content, FAQ |
| notification | `domains/notification/` | Push/email notifications and preferences |
| service-discovery | `domains/service-discovery/` | Search and browse services/welpers |
| geocode | `domains/geocode/` | Forward/reverse geocoding |

### JWT validation — BFF validates, not microservices

- **Strategy**: `apps/bff/src/common/auth/strategies/jwt.strategy.ts` — `passport-jwt`, extracts Bearer token, validates signature with `JWT_SECRET`.
- **Guard**: `JwtAuthGuard` with `@Public()` decorator support — routes are protected by default.
- `validate()` returns `{ userId, email, accountType }` on `req.user`.

### Full endpoint map

#### Auth (`/api/auth/`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | Public | Register new account |
| POST | `/login` | Public | Login, returns tokens |
| POST | `/verify-email` | Public | Verify email with token |
| POST | `/resend-verification` | JWT | Resend verification email |
| POST | `/reset-password` | Public | Request password reset |
| POST | `/reset-password/confirm` | Public | Confirm password reset |
| POST | `/change-password` | JWT | Change password |
| POST | `/refresh` | Public | Refresh access token |
| GET | `/session` | JWT | Get current session |
| POST | `/logout` | JWT | Logout (no-op) |

#### Users (`/api/users/`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | JWT | Get current user |
| PUT | `/me` | JWT | Update current user |
| DELETE | `/me` | JWT | Delete account |
| GET | `/:id` | JWT+Welper | Get user by ID |
| PUT | `/:id/status` | JWT+Welper | Update user status |

#### Profiles (`/api/profiles/`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | JWT | Get current profile (customer or welper) |
| PUT | `/me` | JWT | Update current profile |
| PUT | `/me/onboarding-complete` | JWT | Mark onboarding complete |
| GET | `/customer/:id` | JWT | Get customer profile |
| PUT | `/customer/:id` | JWT | Update customer profile |
| GET | `/welper/:id` | JWT | Get welper profile |
| PUT | `/welper/:id` | JWT | Update welper profile |

#### Availability (`/api/profiles/welper/:welperId/availability/`)
| Method | Path | Auth |
|---|---|---|
| GET | `/` | JWT |
| PUT | `/` | JWT |

#### Service Offerings (`/api/profiles/welper/:welperId/services/`)
| Method | Path | Auth |
|---|---|---|
| GET | `/` | JWT |
| POST | `/` | JWT |
| PUT | `/:serviceId` | JWT |
| DELETE | `/:serviceId` | JWT |

#### Favorites (`/api/profiles/customer/:customerId/favorites/`)
| Method | Path | Auth |
|---|---|---|
| GET | `/` | JWT |
| POST | `/` | JWT |
| DELETE | `/:welperId` | JWT |

#### Bookings (`/api/bookings/`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | JWT | List bookings |
| GET | `/:id` | JWT | Get booking |
| POST | `/` | JWT | Create booking request |
| PATCH | `/:id/accept` | JWT+Welper | Accept booking |
| PATCH | `/:id/decline` | JWT+Welper | Decline booking |
| PATCH | `/:id/check-in` | JWT+Welper | Check in |
| PATCH | `/:id/check-out` | JWT+Welper | Check out (**only** when status is `in_progress`; not while `disputed` — use dispute resolution) |
| PATCH | `/:id/cancel` | JWT | Cancel booking |

#### Disputes & support

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/bookings/:bookingId/disputes` | JWT | File dispute; booking → `disputed` |
| GET | `/api/bookings/:bookingId/dispute` | JWT | Dispute for booking (404 if none) |
| GET | `/api/disputes` | JWT | List disputes (participant; admins see all) |
| GET | `/api/disputes/:id` | JWT | Dispute detail |
| POST | `/api/disputes/:id/resolution` | JWT + **Admin** | Create resolution; dispute → resolved; booking `disputed` → `completed` (default) or `cancelled` if body includes `bookingOutcome: "cancelled"` |
| POST | `/api/support-tickets` | JWT | Create support ticket |
| GET | `/api/support-tickets` | JWT | List current user’s tickets |

#### Booking Chat (`/api/bookings/:bookingId/chat/`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | JWT | Get or create chat thread for booking |
| GET | `/messages` | JWT | List messages (query: page, limit) |
| POST | `/messages` | JWT | Send message (body: content) |

#### Search (`/api/search/`) — all public
| Method | Path |
|---|---|
| GET | `/services` |
| GET | `/categories` |
| GET | `/welpers/:welperId` |

#### Geocode (`/api/geocode/`) — all public
| Method | Path | Params |
|---|---|---|
| GET | `/reverse` | `latitude`, `longitude` |
| GET | `/forward` | `postalCode`, `countryCode` |

#### Content Management — Categories, Questions, Static Content
All follow CRUD pattern: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. Public reads, JWT-protected writes.

#### Admin (`/api/admin/`) — all JWT+Welper
| Method | Path |
|---|---|
| GET | `/users` |
| GET | `/users/:id` |
| PUT | `/users/:id/status` |
| PUT | `/users/:id/background-check` |
| POST | `/users/:id/unlock` |
| GET | `/stats` |

---

## 6. Environment Variables

### Web app (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000    # BFF endpoint
NEXTAUTH_URL=http://localhost:8081           # Frontend URL (port 8081, NOT 8080)
NEXTAUTH_SECRET=<secret>
```

### Key rules

- `NEXT_PUBLIC_` prefix → exposed to browser.
- `NEXTAUTH_URL` must match the actual frontend port (8081).
- Never expose `JWT_SECRET` or database credentials on the frontend.

---

## 7. File Locations

| Purpose | Path |
|---|---|
| API client | `apps/web/lib/api/client.ts` |
| Token helper | `apps/web/lib/api/get-token.ts` |
| Auth config | `apps/web/lib/auth/config.ts` |
| React Query hooks | `apps/web/lib/hooks/` |
| Zustand stores | `apps/web/stores/` |
| Pages (App Router) | `apps/web/app/` |
| Shared UI components | `packages/ui/src/` |
| BFF domains | `apps/bff/src/domains/` |
| BFF JWT strategy | `apps/bff/src/common/auth/strategies/jwt.strategy.ts` |
| Design system bible | `bible/ui-ux.md` |
| Testing bible | `bible/testing.md` |

---

## 8. Common Commands

```bash
pnpm dev                    # Start all apps (turbo)
pnpm build                  # Build all
pnpm test                   # Unit tests (BFF)
pnpm test:e2e               # E2E tests (BFF or web, context-dependent)
pnpm lint                   # Lint all
pnpm type-check             # TypeScript check
```
