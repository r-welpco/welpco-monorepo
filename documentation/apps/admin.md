# apps/admin — Internal Admin Dashboard

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Next.js 16.2.3 app for Welpco operations staff. Runs on **port 8082** (`next dev -p 8082`). Uses `@welpco/ui`, `@radix-ui/themes`, TanStack Query, and `leaflet` (welper-distribution map report).

## Route structure (`apps/admin/app/`)

| Route | Purpose |
|---|---|
| `/login` | Admin sign-in page |
| `/api/auth/[...nextauth]` | NextAuth route handler |
| `(dashboard)/` | Authenticated shell (`app/(dashboard)/layout.tsx` renders `AdminShell` with server-action sign-out) |
| `/audit-logs` | Admin action audit trail |
| `/bookings`, `/bookings/[id]` | Booking management |
| `/categories`, `/categories/new`, `/categories/[id]` | Service category CRUD |
| `/content/{faq,marketing,static}` | CMS content (FAQ items, marketing phrases, static content) |
| `/disputes`, `/disputes/[id]` | Dispute review |
| `/jobs`, `/jobs/[id]` | Job postings |
| `/notifications` | Notification management |
| `/payments` | Payment records |
| `/payouts`, `/payouts/[batchId]` | Payout batch review/approval (`app/(dashboard)/payouts/page.tsx`, `payout-batch-actions.tsx`, backed by `lib/services/admin-payouts-service.ts`) |
| `/questions`, `/questions/new`, `/questions/[id]` | Service-selection questions |
| `/referrals` | Referral program stats |
| `/reports`, `/reports/welper-distribution` | Reports (leaflet map) |
| `/reviews`, `/reviews/[id]` | Review moderation |
| `/settings` | Platform settings |
| `/support-tickets`, `/support-tickets/[id]` | Support tickets |
| `/users`, `/users/new`, `/users/[id]` | User management |

## Authentication

NextAuth v5 (beta.25), JWT session strategy, config in `apps/admin/auth.ts` + `lib/auth/config.ts` + `lib/auth/providers.ts`:

- **Single Credentials provider** (`lib/auth/providers.ts`): POSTs `email`/`password` to BFF `POST /api/auth/login` (`NEXT_PUBLIC_API_URL`, default `http://localhost:3000`). `authorize()` **returns `null` unless `user.accountType` is `admin` (case-insensitive) and `user.status === "Active"`** — non-admin credentials can never create an admin session. BFF `accessToken`/`refreshToken` are stored in the NextAuth JWT.
- **Role gating at the edge** (`apps/admin/middleware.ts`, wraps `auth()`): unauthenticated → redirect `/login`; authenticated non-admin → `/login?error=Forbidden`; non-Active status → `/login?error=AccountInactive`; logged-in visits to `/login` → `/`.
- **Refresh** (`lib/auth/config.ts` `jwt` callback): refreshes via BFF `POST /api/auth/refresh` when within 5 minutes of the assumed 15-minute access-token expiry, deduped per user via a `globalThis` promise map; rotated refresh tokens are kept in the encrypted NextAuth cookie; 401/403 from refresh wipes the token (signed out).
- Secret resolution in `auth.ts`: `NEXTAUTH_SECRET`/`AUTH_SECRET`, rejects known placeholder values, throws in production if unset.

## Service layer (`apps/admin/lib/`)

`lib/api/client.ts` is a trimmed copy of the web `ApiClient` (Bearer token from NextAuth via `lib/api/get-token.ts`, base `NEXT_PUBLIC_API_URL`, one silent retry on 401). Services call it:

| Service | BFF endpoints |
|---|---|
| `admin-audit-service.ts` | `/api/admin/audit-logs` |
| `admin-booking-service.ts` | `/api/admin/bookings`, `/api/admin/bookings/:id` |
| `admin-categories-service.ts` | `/api/categories`, `/api/categories/:id`, `/api/categories/parent/:id` |
| `admin-content-service.ts` | `/api/faq-items`, `/api/marketing-phrases`, `/api/static-content` (+ `/:id`) |
| `admin-dashboard-service.ts` | `/api/admin/dashboard` |
| `admin-job-service.ts` | `/api/admin/jobs`, `/api/admin/jobs/:id` |
| `admin-notifications-service.ts` | `/api/admin/notifications` |
| `admin-payouts-service.ts` *(modified in working tree)* | `/api/admin/payouts/upcoming`, `/batches`, `/batches/:id`, `/batches/build`, `/batches/:id/approve`, `/recoveries`, `/recoveries/:transferId/refresh`, `/tax-failures`, `/refresh-pending-fees`, `/retry-tax` |
| `admin-questions-service.ts` | `/api/questions`, `/api/service-questions`, `/api/service-questions/service/:id`, `/api/content/categories` |
| `admin-referrals-service.ts` | `/api/admin/referrals`, `/api/admin/referrals/stats` |
| `admin-reports-service.ts` | `/api/admin/reports/welper-distribution` |
| `admin-reviews-service.ts` | `/api/admin/reviews`, `/api/admin/reviews/:id` |
| `admin-settings-service.ts` | `/api/admin/settings/payment_capture_delay_minutes` |
| `admin-support-tickets-service.ts` | `/api/admin/support-tickets`, `/api/admin/support-tickets/:id` |
| `admin-users-service.ts` | `/api/admin/users`, `/api/admin/users/:id` |
| `dispute-service.ts` | `/api/disputes`, `/api/disputes/:id` |

These map to BFF controllers in `apps/bff/src/domains/user-management/admin/admin.controller.ts` (also modified in the working tree) and domain controllers — see [../architecture/domains/README.md](../architecture/domains/README.md).

## Scripts (`apps/admin/package.json`)

| Script | Command |
|---|---|
| `dev` | `next dev -p 8082` |
| `build` / `start` | `next build` / `next start -p 8082` |
| `lint` | `eslint .` |
| `type-check` | `tsc --noEmit` |
