# Authentication — End to End

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

The BFF issues its own JWTs; both Next.js apps use **NextAuth v5 (beta.25, JWT session strategy)** purely as a session wrapper around those BFF tokens. The BFF access token rides inside the encrypted NextAuth cookie and is forwarded as `Authorization: Bearer` on every API call.

## BFF side (`apps/bff`)

### Token issuance — `src/modules/auth/auth.controller.ts` (mounted at `/api/auth`)

This is the live auth controller. A near-duplicate exists at `src/domains/user-management/auth/auth.controller.ts` but is **not mounted**: `UserManagementDomainModule` imports `AuthModule.forRoot({ registerController: false })`, so the domain module only provides `AuthService` and friends.

| Endpoint | Notes |
|---|---|
| `POST /api/auth/login` | Rate-limited; returns `{ accessToken, refreshToken, user }` |
| `POST /api/auth/register` | Legacy full registration; Turnstile-verified |
| `POST /api/auth/signup/begin` | New stepwise signup; Turnstile-verified; idempotent (409 `ACCOUNT_EXISTS`); returns bootstrap token pair |
| `GET /api/auth/signup/state` | Signup progress for the authenticated signup session |
| `POST /api/auth/signup/step/*` | `select-role`, `identity`, `welper-bio`, `welper-service-area`, `welper-offering`, `welper-availability`, `welper-background-check`, `welper-payout`, `notification-prefs`, `optional-profile` |
| `POST /api/auth/signup/finish` | Completes signup (may 4xx with `missingFields`) |
| `POST /api/auth/verify-email` / `resend-verification-email` | Email verification; resend is Turnstile-verified (`resend_verification`) |
| `POST /api/auth/reset-password` / `reset-password/confirm` | Turnstile-verified (`password_reset`); rate-limited |
| `POST /api/auth/change-password` | Authenticated |
| `POST /api/auth/refresh` | Public; body `{ refreshToken }` → new `{ accessToken, refreshToken }` pair |

### JWT strategy, guards, decorators — `src/common/auth/`

- **`strategies/jwt.strategy.ts`** — passport-jwt Bearer strategy, verifies with `JWT_SECRET`, then **loads the user from the DB** (`id, email, accountType, status, signupCompleted, authVersion`) so revoked/changed accounts are rejected even with a valid signature. Payload: `{ sub, email, accountType, authVersion }`.
- **`guards/jwt-auth.guard.ts`** — `AuthGuard('jwt')` that short-circuits when `@Public()` metadata is present.
- **`guards/roles.guard.ts`** — checks `@Roles(...)` metadata against `user.effectiveRole` (derived from `accountType` via `common/auth/effective-role.util.ts`).
- **`guards/signup-completed.guard.ts`** — 403 `SIGNUP_COMPLETION_REQUIRED` unless `signupCompleted` (admins bypass). A related `common/guards/email-verified.guard.ts` returns 403 `EMAIL_VERIFICATION_REQUIRED` on bookable actions (booking controller).
- **`decorators/`** — `@Public()`, `@Roles()`, `@CurrentUser()`.

### Token lifetimes & rotation (`src/common/auth/jwt-module-options.factory.ts`, `auth.service.ts`)

| Token | Secret | TTL (env, default) |
|---|---|---|
| Access | `JWT_SECRET` | `JWT_EXPIRES_IN`, default **15m** |
| Refresh | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES_IN`, default **7d** |

`AuthService.refreshToken()` verifies the refresh JWT, re-loads the user, rejects suspended/deactivated accounts, Guardian accounts, non-Active admins, and any token whose `authVersion` no longer matches the DB (**bumping `authVersion` revokes all outstanding pairs** after password/role/status changes), then issues a **fresh rotated pair**.

### Turnstile / human verification

`src/common/human-verification/human-verification.service.ts` (`assertVerified`) validates a Cloudflare Turnstile token against `TURNSTILE_SECRET_KEY` plus a honeypot field (`website`). Applied to `register`, `signup/begin` (`signup_begin`), `resend-verification-email` (`resend_verification`), and `reset-password` (`password_reset`).

## Web side (`apps/web`)

Config: `auth.ts` (root) + `lib/auth/config.ts` + `lib/auth/providers.ts`. Detailed design doc: `apps/web/docs/AUTHENTICATION_ARCHITECTURE.md` (audited accurate).

- **Provider**: single Credentials provider with two paths — (a) normal email/password → BFF `POST /api/auth/login` (rejects `accountType === "admin"`); (b) **signup bootstrap**: after `POST /api/auth/signup/begin` the client signs in with `signupBootstrap: "true"` plus the returned token pair, validated via `GET /api/auth/signup/state` (avoids a redundant login call).
- **Session**: `strategy: "jwt"`, `maxAge: 7d` to match the BFF refresh-token lifetime. `session.accessToken` is exposed to the browser for the API client; the **refresh token never leaves the encrypted HttpOnly NextAuth cookie**. `session()` returns `null` when the token has no `accessToken`/user id, so a failed refresh reads as signed out.
- **Refresh** (`jwt` callback): decodes the access JWT's real `exp` (so it tracks `JWT_EXPIRES_IN`), refreshes via `POST {origin}/api/auth/refresh` when within 5 minutes of expiry, deduped per user via a `globalThis` promise map; 401/403 wipes the whole token. Server-side refresh origin: `AUTH_INTERNAL_API_URL` → `INTERNAL_API_URL` → `NEXT_PUBLIC_API_URL`. Role (`customer`/`welper`) is re-derived from the access token's `accountType` claim on every pass.
- **Forwarding**: `lib/api/client.ts` attaches `Authorization: Bearer` from `lib/api/get-token.ts` (30s cache; on 401, clears cache and retries once so `getSession()` triggers the refresh).
- **Secret**: `NEXTAUTH_SECRET`/`AUTH_SECRET`; placeholder values rejected; throws in production if missing.
- **Turnstile UI**: `components/security/turnstile-widget.tsx` renders the Cloudflare widget with `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; tokens are sent in auth/signup payloads for the BFF to verify. The web app also verifies Turnstile server-side itself in `app/api/contact/route.ts` via `lib/security/human-verification.ts` (uses its own `TURNSTILE_SECRET_KEY`).

## Admin side (`apps/admin`)

Same NextAuth v5 pattern, hardened for a single role (see [../apps/admin.md](../apps/admin.md)):

- Credentials provider hits the same BFF `POST /api/auth/login` but returns `null` unless `accountType` is `admin` **and** `status === "Active"`.
- `middleware.ts` wraps `auth()` over every route: unauthenticated → `/login`; non-admin → `/login?error=Forbidden`; inactive → `/login?error=AccountInactive`.
- Refresh mirrors the web flow (5-min window, per-user dedupe, rotated refresh token kept in the cookie) but assumes a fixed 15-minute access TTL rather than decoding `exp`.
- BFF-side defense in depth: admin endpoints are guarded by `JwtAuthGuard` + `RolesGuard` in `src/domains/user-management/admin/admin.controller.ts`, and `refreshToken()` rejects non-Active admin accounts.

## Flow

- **Signup** — web POSTs `/api/auth/signup/begin` (Turnstile token + honeypot verified) → BFF creates a pending account and returns `{ accessToken, refreshToken }` → web calls `signIn("credentials", { signupBootstrap: "true", ... })`; provider validates via `GET /api/auth/signup/state` and seeds the NextAuth JWT → client walks `POST /api/auth/signup/step/*` → `POST /api/auth/signup/finish`; the session `update()` trigger re-validates state server-side and flips `signupCompleted`.
- **Login** — `signIn("credentials")` → provider POSTs `/api/auth/login` → BFF checks credentials + lockout, signs a 15m access JWT (`sub`, `email`, `accountType`, `authVersion`) and a 7d refresh JWT → both stored in the encrypted NextAuth cookie; `session.accessToken` exposed to the app.
- **Authenticated request** — `apiClient` reads the access token from the session and sends `Authorization: Bearer` to `http://localhost:3000/api/...` → `JwtAuthGuard` → `JwtStrategy.validate()` re-loads the user from DB → `RolesGuard`/`SignupCompletedGuard`/`EmailVerifiedGuard` as declared per route.
- **Refresh** — within 5 min of access expiry (or after a 401-triggered `getSession()`), the NextAuth `jwt` callback POSTs the refresh token to `/api/auth/refresh` → BFF verifies signature + user status + `authVersion` and returns a **rotated pair** → cookie updated; on 401/403 the session is invalidated and the user is signed out.
