# Auth (login + registration + verification + password reset) — open tickets

> **Validation: 2026-07-04** — every ticket below re-verified against the implementation at commit `b809feb`. Status tags: ✅ SHIPPED · 🟢 STILL OPEN · 🟡 PARTIAL · ⚫ OBSOLETE · ❓ UNVERIFIED.

Source: Day 9 auth functional audit (`apps/web/AUDIT-LOG.md`).
4 P0/P1 fixes already shipped in that audit. The 13 items below are the remaining open work, ticket-ready, ordered by priority.

---

## LOGIN-001 — Move CacheService to Redis

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/cache/cache.module.ts` — still provides only `MemoryCacheService` (in-process `Map`); no redis dependency in `apps/bff/package.json`. Cited file split since: `cache.service.ts` now delegates to `memory-cache.service.ts`.

- **Priority**: P0 (gated on multi-replica BFF deploy — single-replica = OK)
- **Area**: BFF infra
- **Problem**: `apps/bff/src/domains/user-management/cache/cache.service.ts` (`MemoryCacheService`) is an in-process `Map`. Account-lockout, login rate-limit, password-reset rate-limit, and verify-email rate-limit all live there. BFF restart resets every counter. A second BFF replica makes them ineffective — each replica has its own bucket; an attacker pinning to one replica until it locks, then hopping, defeats the policy.
- **Proposed solution**: replace `MemoryCacheService` with a Redis-backed implementation behind the existing `CacheService` interface. Use `ioredis` or `@upstash/redis` (whichever fits the deploy target). Keep the local-memory variant for tests/dev.
- **Acceptance criteria**:
  - All five existing cache consumers (lockout + 4 rate-limits) work against Redis with no code change in their consumers.
  - Counters survive BFF restart.
  - Two BFF replicas share state (verify with a multi-replica integration test or staging run).
  - `CACHE_DRIVER` env var selects between `memory` (dev/test default) and `redis` (prod).
- **Effort**: M (≈ half-day implementation + ops setup).
- **Files**: `apps/bff/src/domains/user-management/cache/cache.service.ts`, new `redis-cache.service.ts`, `cache.module.ts`.

---

## ~~LOGIN-002 — Login of unverified accounts must route to /verification, not "Invalid credentials"~~

**[⚫ OBSOLETE — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/auth/auth.service.ts:211-216` — login no longer throws on unverified email (verification gate moved to `EmailVerifiedGuard` on bookable actions); prior "Resolved (2026-05-06)" marker confirmed correct.

**Resolved (2026-05-06)** — superseded by the signup-merge Phase 3 architecture.
Unverified login no longer routes to /verification or shows "Invalid credentials" —
it lands on the dashboard with a verification banner; bookable actions return
a typed 403 surfaced as a focused dialog with one-click resend. See
`features/SIGNUP_MERGE_PLAN.md` Phase 3 + AUDIT-LOG Day 15.

- **Priority**: P1
- **Area**: Login UX + auth flow
- **Problem**: BFF `auth.service.ts:186` throws `UnauthorizedException('Please verify your email address before logging in')` for unverified users. Web `apps/web/lib/auth/providers.ts:13` `Credentials.authorize` catches any exception and returns `null` — NextAuth surfaces this uniformly as `CredentialsSignin`, so the user sees the platform `<LoginForm>`'s generic "Invalid email or password" with no path forward.
- **Proposed solution** (preferred): change BFF to allow login with `emailVerified: false` and let `proxy.ts` route to `/verification` (aligns with the existing onboarding-not-completed pattern). Alternative: NextAuth provider catches the BFF error and surfaces a typed error (`CredentialsSignin` with reason).
- **Acceptance criteria**:
  - Unverified user signs in with correct password → lands on `/verification` with their email pre-filled.
  - Unverified user signs in with wrong password → still gets "Invalid email or password" (no enumeration leak: known email + bad password ≠ unknown email).
  - Unverified user signing in with `?next=…` → after verification, `?next=` is preserved.
  - Tests: e2e covers both branches; unit tests cover the BFF `auth.service` change.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/user-management/auth/auth.service.ts`, `apps/web/lib/auth/providers.ts`, `apps/web/proxy.ts`, e2e specs.

---

## LOGIN-003 — Add per-IP login rate limit orthogonal to per-email cap

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/bff/src/modules/auth/auth.controller.ts:56-59` — the per-email login rate limit cited at `:40` has since been REMOVED (comment: brute force handled by `AccountLockoutService` only); no per-IP cap and no global throttler exist, so spray protection is weaker than when this was filed. Guard now lives at `apps/bff/src/domains/user-management/auth/guards/rate-limit.guard.ts`.

- **Priority**: P1
- **Area**: Login security
- **Problem**: `apps/bff/src/modules/auth/auth.controller.ts:40` rate-limits per email. A password-spray attack (1 attempt per email, many emails, 1 IP) creates a fresh bucket every email — no IP-level cap fires. Per-email cap protects any single account; doesn't protect against organised spray.
- **Proposed solution**: add a second `RateLimitGuard` keyed on IP. ~50 attempts / 15 min / IP. Tune to not break shared-NAT (offices, university campuses) — observe in staging.
- **Acceptance criteria**:
  - Single IP making 51 login attempts across 51 different emails in 15 min → 51st request returns 429.
  - Single IP making 50 attempts on 50 different emails → all pass through to per-email lockout (no false positives).
  - Lockout still wins if per-email count is exceeded first.
- **Effort**: S.
- **Files**: `apps/bff/src/modules/auth/auth.controller.ts`, `apps/bff/src/common/rate-limit/rate-limit.guard.ts` (may need multi-key support).

---

## LOGIN-004 — Email normalization in DTOs + DB migration

**[🟡 PARTIAL — verified 2026-07-04]** Evidence: normalization now at service level for login (`apps/bff/src/domains/user-management/auth/auth.service.ts:176`), password reset (`password-reset.service.ts:46`), verify-email compare (`email-verification.service.ts:112`), and signup wizard DTO (`apps/bff/src/modules/auth/dto/begin-signup.dto.ts:23-24`); but `login/register/verify-email/reset-password` DTOs still lack `@Transform`, legacy `POST /auth/register` stores the raw email, and no DB normalization migration exists in `apps/bff/src/domains/user-management/migrations/`.

- **Priority**: P1
- **Area**: Account uniqueness
- **Problem**: `Test@Example.com` and `test@example.com` register as different accounts; whitespace at signup blocks future logins. `class-validator`'s `@IsEmail` validates but doesn't normalise.
- **Proposed solution**: add `@Transform(({ value }) => value?.toLowerCase().trim())` to every email field across login / register / verify / reset DTOs. Pair with a one-time idempotent migration on `user_accounts.email`.
- **Acceptance criteria**:
  - Re-running the migration is idempotent.
  - No existing duplicate-email rows after migration (resolve duplicates via product decision: prefer earliest `created_at`, soft-delete the rest, log).
  - All auth-related endpoints accept any case/whitespace and treat the underlying account as one.
  - Tests: unit covers DTO normalization; migration has a dry-run + commit phase.
- **Effort**: M (mostly migration + duplicate resolution).
- **Files**: all `apps/bff/src/modules/auth/dto/*.dto.ts`, new migration in `apps/bff/src/domains/user-management/migrations/`, normalisation also applied to `users.service.ts` profile updates.

---

## LOGIN-005 — Refresh-token rotation deny-list

**[🟡 PARTIAL — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/auth/auth.service.ts:390-396` — an `authVersion` check (migration `20260608000001-AddUserAuthVersion.ts`) now revokes all pairs on password/role/status security changes; but there is no per-jti deny-list, so a rotated refresh token remains valid until natural expiry and replay is not detected.

- **Priority**: P1
- **Area**: Session security
- **Problem**: `auth.service.ts:336` rotates both access + refresh tokens, but the OLD refresh token remains cryptographically valid until its natural expiry (it's a stateless JWT). An attacker with a leaked refresh token can keep using it after the legitimate user rotates.
- **Proposed solution**: persist rotated jti to a deny-list (Redis with TTL = refresh token's remaining lifetime). Reject any later presentation of a rotated jti as session compromise — invalidate ALL of the user's refresh tokens (force re-login everywhere).
- **Acceptance criteria**:
  - Rotating a refresh token writes its jti + user-id to deny-list with appropriate TTL.
  - Re-presenting a denied jti returns 401 + invalidates all of that user's sessions.
  - Audit log written for every "rotated jti replay" event.
  - Tests cover rotation, replay, multi-device hand-off.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/user-management/auth/auth.service.ts`, new `refresh-token-deny-list.service.ts`, depends on LOGIN-001 (Redis).

---

## LOGIN-006 — Login rate-limit keyGen email normalization

**[⚫ OBSOLETE — verified 2026-07-04]** Evidence: `apps/bff/src/modules/auth/auth.controller.ts:56-59` — the login rate limit (and its keyGen) was removed entirely; the remaining email-keyed keyGens already normalize (`auth.controller.ts:96`, `:152`), as does lockout (`account-lockout.service.ts:50`). Nothing left to fix.

- **Priority**: P2
- **Area**: Consistency
- **Problem**: Account-lockout normalises email (`email.toLowerCase().trim()`) but `apps/bff/src/modules/auth/auth.controller.ts:40` login rate-limit keyGen does not. `Test@…` and `test@…` hit different rate buckets but the same lockout counter. Confusing semantics; defeats the rate-limit on minor variations.
- **Proposed solution**: lower+trim the email in the keyGen to match lockout behaviour.
- **Acceptance criteria**: keyGen produces the same bucket for `Test@example.com`, `test@example.com`, ` test@example.com `.
- **Effort**: XS (one-line fix).
- **Files**: `apps/bff/src/modules/auth/auth.controller.ts:40`.

---

## LOGIN-007 — /verification page fallback when email is missing

**[🟡 PARTIAL — verified 2026-07-04]** Evidence: file moved to `apps/web/app/[locale]/(auth)/verification/verification-page-client.tsx:111-124` — the blank-page `return null` is gone; a fallback message + "Back to login" button renders, and the email fallback chain now also checks the session. Gap: the login link is a plain `href="/login"` and does not preserve `?next=` (explicit AC).

- **Priority**: P2
- **Area**: Verification UX
- **Problem**: `apps/web/app/(auth)/verification/verification-page-client.tsx:69` does literal `return null` when both URL search param and Zustand store have no email. User sees a blank page with no CTA, no message, no path forward.
- **Proposed solution**: render a Card with "We don't know which email to verify — sign in to continue" + Sign-in CTA → `/login`.
- **Acceptance criteria**:
  - Visiting `/verification` with no `?email=` and an empty store renders the fallback card.
  - The Sign-in link preserves any `?next=`.
  - Existing happy path (email present) unchanged.
- **Effort**: XS (~15 LOC).
- **Files**: `apps/web/app/(auth)/verification/verification-page-client.tsx`.

---

## LOGIN-008 — Password-reset success copy decoupled from store write

**[🟡 PARTIAL — verified 2026-07-04]** Evidence: file moved to `apps/web/app/[locale]/(auth)/forgot-password/page.tsx` — success card now renders from local state (`sentEmail`, line 30/55/79), but `setPasswordResetEmail`/`setPasswordResetSent` are still written on submit (lines 53-54); the store fields have no other consumers (`apps/web/stores/userStore.ts`), so removal is still pending.

- **Priority**: P2
- **Area**: Honesty contract
- **Problem**: Web `request-password-reset` writes `passwordResetEmail` + `passwordResetSent: true` to Zustand unconditionally on submit. The success card text is correctly enumeration-safe ("If an account exists for {email}…"), but the *store* now states a fact ("we sent a reset to this email") that isn't always true.
- **Proposed solution**: don't write the global store on submit. Render the success card from local component state. Doesn't change BFF; preserves the enumeration-safe phrasing while keeping the store honest about what's known.
- **Acceptance criteria**: store fields `passwordResetEmail` + `passwordResetSent` removed from the submit handler (or removed entirely if no other consumer). Success card still renders.
- **Effort**: S.
- **Files**: `apps/web/app/(auth)/forgot-password/page.tsx`, related Zustand store.

---

## LOGIN-009 — Forgot-password link in LoginForm preserves ?next=

**[✅ SHIPPED — verified 2026-07-04]** Evidence: `apps/web/app/[locale]/(auth)/login/login-page-client.tsx:145` — `router.push(withNext("/forgot-password", nextRaw))` via the `onForgotPassword` callback prop now taken by `packages/ui/src/platform/user-management/login-form.tsx`; forgot-password's cancel also round-trips `next` (`forgot-password/page.tsx:66`).

- **Priority**: P2
- **Area**: Redirect chain
- **Problem**: "Forgot password?" link inside `packages/ui/src/platform/user-management/login-form.tsx` doesn't propagate `?next=` from the parent page. After password reset, user lands on `/login?verified=true` and has to re-navigate to their original destination.
- **Proposed solution**: read `next` query param from the page; pass to `<LoginForm>` as a prop; append on the forgot-password link href.
- **Acceptance criteria**: clicking "Forgot password?" from `/login?next=/dashboard/messages/abc` lands on `/forgot-password?next=/dashboard/messages/abc`. After reset → login → `/dashboard/messages/abc`.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/login-form.tsx`, `apps/web/app/(auth)/login/login-page-client.tsx`, `apps/web/app/(auth)/forgot-password/page.tsx`.

---

## LOGIN-010 — Resend-code countdown UX

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `packages/ui/src/platform/user-management/account-verification.tsx:245-249` — resend button is only `disabled={loading}`; no cooldown/countdown state exists.

- **Priority**: P3
- **Area**: Verification UX
- **Problem**: "Resend code" button has no client-side cooldown. Backend rate-limit catches abuse but the UX is hostile — users hammer the button when frustrated and get unexplained 429s.
- **Proposed solution**: 30s countdown timer in `<AccountVerification>` after each resend; button disabled with countdown text ("Resend in 24s").
- **Acceptance criteria**: clicking "Resend code" disables the button + shows countdown for 30s; countdown re-arms after each click.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/account-verification.tsx`.

---

## LOGIN-011 — Auth observability (failed logins, password reset frequency, rate-limit hits)

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/auth/guards/rate-limit.guard.ts` has no logging at all; only admin-action auditing exists (`apps/bff/src/domains/user-management/admin/admin-audit.service.ts`) — no structured audit log for failed logins / 429s.

- **Priority**: P3
- **Area**: Observability + incident response
- **Problem**: No structured audit log for failed logins, password-reset request frequency, or verify-email rate-limit hits. `accountLockoutService` increments a counter; no append-only record of which IPs / user-agents tried what when. Blind spot for incident response and SOC 2 readiness.
- **Proposed solution**: emit structured logs on every 401 in `auth.service.ts` and every rate-limit `HttpException` in `RateLimitGuard`. Include hashed IP, user-agent, email (if applicable), endpoint, timestamp. Pipe to whatever aggregator the project ends up using (CloudWatch / Datadog / etc.).
- **Acceptance criteria**:
  - Every 401 from `auth.service.ts` produces a structured log entry.
  - Every rate-limit 429 from `RateLimitGuard` produces a structured log entry.
  - PII is hashed (SHA-256 of IP + email).
  - Log shape documented in a small `apps/bff/src/common/audit/README.md`.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/user-management/auth/auth.service.ts`, `apps/bff/src/common/rate-limit/rate-limit.guard.ts`, new audit log module.

---

## LOGIN-012 — Email-change reverification flow

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/users/users.service.ts:44-51` — email swap is still silent (`emailVerified = false`, no challenge to the new address, no notification to the old); web call moved to `apps/web/lib/services/user-service.ts:268` (`updateEmail` → `PUT /api/users/me`).

- **Priority**: P3
- **Area**: Account security
- **Problem**: `apps/web/lib/services/user-service.ts:233` calls `PUT /api/users/me { email }` and the user is silently logged in with the new email — no re-verification, no notification to the OLD address. If the session is compromised, the attacker can rotate the sign-in email and lock the legitimate user out.
- **Proposed solution**: changing email becomes a 2-step flow: user requests change → BFF sends verification code to NEW email + notification to OLD email ("we received a request to change your sign-in email; if this wasn't you, click here") → user enters verification code → swap performed.
- **Acceptance criteria**:
  - Email change requires verification code on the new address before swap.
  - OLD email receives a notification with a "this wasn't me" link that reverts the change request and forces password reset.
  - Tests cover happy path + revert path.
- **Effort**: L.
- **Files**: `apps/bff/src/domains/user-management/users/users.service.ts`, new BFF endpoint, web profile/settings flow.

---

## LOGIN-013 — Auth options: 2FA / TOTP, magic link, social login (Google / Apple)

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/web/lib/auth/providers.ts` — Credentials is still the only NextAuth provider; no TOTP/magic-link/social endpoints anywhere in `apps/bff/src/modules/auth/` or `apps/bff/src/domains/user-management/auth/`.

- **Priority**: P3 (each is its own product call)
- **Area**: Auth options
- **Problem**: No 2FA / TOTP, no magic link, no social login. Platform forms exist (`<TwoFactorAuth>` shipped in Tier 2); BFF endpoints don't.
- **Proposed solution**: each is a focused phase, ship in this order based on leverage:
  1. **2FA / TOTP** — highest-leverage trust signal; covers Welper trust + payment surfaces.
  2. **Magic link** — highest-leverage UX win; passwordless option for new + existing users.
  3. **Social login (Google / Apple)** — highest-leverage conversion win; reduces signup friction.
- **Acceptance criteria** (per option): full happy-path + recovery + e2e + threat model review.
- **Effort**: L per option.
- **Files**: BFF user-management/auth domain (new endpoints + token shapes), web `(auth)` routes, NextAuth provider config.

---

## Bonus — out-of-audit-scope but worth filing

### LOGIN-014 — Account deletion grace period

**[🟢 STILL OPEN — verified 2026-07-04]** Evidence: `apps/bff/src/domains/user-management/users/users.service.ts:81-92` — problem statement is stale (it's a soft-deactivate to `status=DEACTIVATED`, not a hard-delete), but no grace window, restore-on-login (login while DEACTIVATED is rejected, `auth.service.ts:201-203`), restore email, or scheduled hard-delete exists.

- **Priority**: P3
- **Problem**: `DELETE /api/users/me` is immediate hard-delete. Industry standard: 30-day soft-delete + restore window.
- **Proposed solution**: BFF marks `deletedAt`; cron job hard-deletes after 30 days. User receives an email with restore link valid for the grace period. Login during grace cancels the deletion + notifies.
- **Effort**: M.

---

## Suggested execution order if you want to pick a fast bundle

**"Half-day high-leverage swing"**: LOGIN-002 + LOGIN-006 + LOGIN-007 — three small UX/security wins, zero migration risk, ship together.

**"Pre-launch security harden"**: LOGIN-001 (if multi-replica) + LOGIN-003 + LOGIN-004 + LOGIN-005 — closes the security gaps that matter for any production deploy.

**"Polish + observability"**: LOGIN-008 + LOGIN-009 + LOGIN-010 + LOGIN-011 — small fixes + the observability foundation that compounds over time.

**"New auth surfaces"** (product decisions): LOGIN-012 + LOGIN-013 + LOGIN-014.

---

## LOGIN-015 — Document the NextAuth JWT-refresh contract for BFF state mutations

**[🟡 PARTIAL — verified 2026-07-04]** Evidence: the machinery hardened — `apps/web/lib/auth/config.ts` (~195-205) now revalidates `emailVerified`/`signupCompleted` against BFF `GET /api/auth/signup/state` on the `update()` trigger, and sync helpers exist (`apps/web/lib/auth/sync-email-verification-session.ts`); but the documented contract itself (JSDoc block in `config.ts`, `proxy.ts` comment, `use-refresh-session.ts` helper) was never written.

- **Priority**: P2
- **Area**: Session contract / developer ergonomics
- **Problem**: BFF mutations that flip middleware-routed flags (`signupCompleted`, `emailVerified`, future verified-by-KYC, future `payoutMethodChoice`-derived gates) leave the NextAuth JWT cookie stale until natural expiry. The middleware (`apps/web/proxy.ts`) reads those flags to drive its 4-state machine, so a stale JWT causes routing loops — the user finishes a flow server-side but the browser keeps reading the old state. Day 16 hit this: `finishSignup` flipped `signupCompleted: true` on the BFF; `router.replace("/dashboard")` then hit `proxy.ts` which still saw the old JWT (`signupCompleted: false`) and bounced the user back to `/register`. Fixed inline by calling `useSession().update({ user: { signupCompleted: true } })` after the mutation. The contract is undocumented and the next feature dev will hit it again.
- **Proposed solution**:
  1. Add a JSDoc block at the top of `apps/web/lib/auth/config.ts` documenting which session fields are middleware-routed (today: `signupCompleted`, `emailVerified`) and the contract: any mutation that flips one MUST call `useSession().update({ ... })` BEFORE relying on a `router.replace` that crosses a middleware boundary.
  2. Optional: a small `useRefreshSession()` helper in `apps/web/lib/hooks/use-refresh-session.ts` that wraps `useSession().update()` and lints/types the legal field shape (so a TypeError surfaces if someone passes an unknown field).
  3. Add a comment on `proxy.ts`'s 4-state machine pointing back at this contract.
- **Acceptance criteria**:
  - JSDoc / contract block present in `lib/auth/config.ts` listing every middleware-routed JWT field with a note: "any BFF mutation that flips this MUST call session.update({ ... })".
  - At least one in-tree usage example (the `finish-page-client.tsx` post-`finishSignup` call) referenced as the canonical pattern.
  - A grep for `signupCompleted: true` and `emailVerified: true` in the web codebase returns only the legitimate sites (login flow, finish-signup, future KYC, future Stripe Connect) — and every one of them is followed by an `update()` call within the same `try` block.
- **Effort**: S (~1 hour: doc + grep audit + maybe a helper hook).
- **Files**: `apps/web/lib/auth/config.ts`, `apps/web/proxy.ts` (comment only), optional new `apps/web/lib/hooks/use-refresh-session.ts`.
