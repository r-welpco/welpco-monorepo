# Signup ↔ onboarding merge — implementation plan

> **Status: EXECUTED (2026-05-06) — historical plan.** The merge shipped; see apps/web/AUDIT-LOG.md Day 15. Kept for traceability.

**Goal**: collapse signup + onboarding-welcome into a single role-aware wizard so an account is never "created but unusable." Subsumes the architectural concern behind `ONBOARDING-003` (P0), `ONBOARDING-005`, `ONBOARDING-008`, and parts of `LOGIN-002` + `DASHBOARD-001`.

**Non-goal**: real-data migration. The product is in development; existing user_accounts can be dropped or null-filled. Schema migrations are forward-additive; no backfill scripting needed.

**Outcome contract**: when a row in `user_accounts` has `signupCompleted: true`, that account has every field its role needs to use the product end-to-end. No exceptions, no fallbacks-as-the-norm, no "verified but can't earn" Welpers, no "logged in but missing critical data" Customers.

---

## Architecture decisions (locked)

### Required fields per role

| Field | Customer | Welper | Notes |
|---|:---:|:---:|---|
| `email` | ✅ | ✅ | Step 1 |
| `password` | ✅ | ✅ | Step 1 |
| `selectedRole` | ✅ | ✅ | Step 1 (after fork) |
| `firstName` + `lastName` | ✅ | ✅ | Step 2 |
| `phone` | ✅ | ✅ | Step 2 — `libphonenumber-js`-validated (closes `ONBOARDING-002`) |
| `dateOfBirth` | ✅ | ✅ | Step 2 — minor → guardian fork |
| ToS + Privacy acceptance | ✅ | ✅ | Step 2 |
| `bio` (≥120 chars) | — | ✅ | Welper step 3 |
| `serviceArea` (city + province + country + ≥1 postal-code prefix) | — | ✅ | Welper step 4 — uses Wave 1 `serviceAreaInfo` schema |
| ≥1 `serviceOffering` (categoryId + title + hourlyRate + description) | — | ✅ | Welper step 5 |
| ≥1 weekly availability slot | — | ✅ | Welper step 6 — OR explicit "ad-hoc only" toggle |
| `notificationPreferences` (defaults pre-checked) | ✅ | ✅ | Final step — opt-out, not opt-in |
| Profile photo | optional | optional | Final step — skippable; closes nothing required |
| Payout method | — | optional | Welper final step — skippable; can't receive payments without it (BFF gate). Stripe Connect onboarding link surfaced. |
| Address (delivery / location for search) | optional | — | Final step — skippable |

**Customer steps total**: 3–4 (email/pwd + identity + prefs/optional).
**Welper steps total**: 7–8 (email/pwd + identity + bio + service area + offering + availability + payout + prefs).

### Verification timing — **parallel-during**

- After step 1 (email + password set), account is created in `pending_email_verification` state.
- Verification email sends asynchronously (fire-and-forget — same Wave 2 enumeration-safe pattern).
- User keeps progressing through subsequent steps in the same session **whether or not** they've clicked the email link.
- Email verification unlocks `bookableActions` (creating bookings, receiving payments, account-sensitive settings) — gated BFF-side via an `EmailVerifiedGuard`.
- Dashboard accessible after `signupCompleted: true` regardless of `emailVerified`. Banner says "Verify your email to start booking" when not yet verified.

### Persistence model — **incremental server-side**

- Each step submits to BFF; the corresponding domain entity (`customerProfile` / `welperProfile` / `serviceOffering` / `availabilitySlot` / etc.) is upserted on every step.
- `userAccount.signupCompleted` flips to `true` on the LAST step's submit (BFF computes "all required fields present for this role" — server is the source of truth).
- No client-side state. The wizard reads from `GET /auth/signup/state` on every entry. If user drops mid-wizard, returning to signup brings them back to where they left off — same on a different device, same after browser crash.

### State machine

| `signupCompleted` | `emailVerified` | What the user can do |
|:---:|:---:|---|
| `false` | `false` | Wizard only. `/dashboard/*` redirects to wizard. Limited BFF surface (`/auth/signup/*` only). |
| `false` | `true` | Wizard only. (Edge case: user clicks verification email mid-wizard — fine, just unlocks bookableActions earlier.) |
| `true` | `false` | Dashboard accessible. `bookableActions` gated. Banner reminds to verify. |
| `true` | `true` | Full product. |

### Middleware (`proxy.ts`) contract

- `signed-out` + `/dashboard/*` → `/login?next=…` (unchanged).
- `signed-in` + `signupCompleted: false` + any path → `/register` (the wizard reads server state and lands the user on the right step).
- `signed-in` + `signupCompleted: true` + `emailVerified: false` + `/dashboard/*` → allowed; banner shown.
- `signed-in` + both `true` + `/login` or `/register` → `/dashboard`.

### `/onboarding-welcome` deprecation

The route is removed. It exists today only because the post-verification onboarding was a separate flow. With the merge, there's nothing for it to do. The middleware enforces wizard completion before dashboard access.

---

## Phase plan

Each phase is independently shippable and tested. Phases 1–4 land in dependency order; phases 5–7 are cross-cutting (tests + docs + verify).

### Phase 0 — Lock the architecture

**Goal**: get product + eng aligned on the contracts above before any code lands.

**Deliverables**:
- This document, reviewed and approved.
- Update `apps/web/AUDIT-LOG.md` Day 14 entry with a forward-pointer: "Day 15 begins the signup-merge architecture; tickets ONBOARDING-003 / 005 / 008 are subsumed by `features/SIGNUP_MERGE_PLAN.md`."
- Update `features/onboarding_features.md`: mark the subsumed tickets with a note: "Architecturally subsumed by `SIGNUP_MERGE_PLAN.md`. Do not implement standalone."

**Files**: this file (`features/SIGNUP_MERGE_PLAN.md`), `apps/web/AUDIT-LOG.md`, `features/onboarding_features.md`.

---

### Phase 1 — BFF foundation

**Goal**: signup state machine + per-step endpoints + role-conditional validation + verification email (parallel).

**Deliverables**:
- New columns on `user_accounts`: `signup_completed: boolean DEFAULT false NOT NULL`, `selected_role: enum('customer', 'welper') NULL`. Migration: `apps/bff/src/domains/user-management/migrations/<timestamp>-AddSignupState.ts`. Repurpose existing `email_verified`; deprecate `onboarding_completed` field (or alias to `signup_completed`).
- DTOs in `apps/bff/src/modules/auth/dto/`:
  - `BeginSignupDto` (email, password)
  - `SelectRoleDto` (role: 'customer' | 'welper')
  - `IdentityStepDto` (firstName, lastName, phone via `libphonenumber-js`, dateOfBirth, tosAcceptedAt, privacyAcceptedAt)
  - `WelperBioStepDto`, `WelperServiceAreaStepDto`, `WelperOfferingStepDto`, `WelperAvailabilityStepDto`, `WelperPayoutStepDto` (Welper-only)
  - `NotificationPrefsStepDto` (final step both roles)
  - `OptionalProfileStepDto` (photo, address, etc.)
- Endpoints in `apps/bff/src/modules/auth/auth.controller.ts`:
  - `POST /auth/signup/begin` → creates account in `signup_completed: false` state, sends verification email.
  - `GET /auth/signup/state` → returns `{ selectedRole, completedSteps[], nextStep, requiredFields, filledData }`. Source of truth for the wizard.
  - `POST /auth/signup/step/identity` → upserts `userAccount` identity fields.
  - `POST /auth/signup/step/welper-bio` (etc., one per step shape) → upserts the relevant entity.
  - `POST /auth/signup/finish` → validates all required fields are present for the role; flips `signup_completed: true`. Returns 422 with structured field-list if anything missing.
- Service: `SignupOrchestratorService` in `apps/bff/src/domains/user-management/auth/`. Knows the role-conditional required-fields contract; computes `nextStep` based on what's persisted vs what's required; coordinates writes across `userAccount`, `customerProfile`, `welperProfile`, `serviceOffering`, `availabilitySlot`.
- Guard: `EmailVerifiedGuard` (`apps/bff/src/common/guards/email-verified.guard.ts`). Applied to bookable-action endpoints (`/bookings/create`, `/payments/*`, sensitive `/users/me` updates). Returns 403 with code `EMAIL_VERIFICATION_REQUIRED`.

**Tests**:
- `signup-orchestrator.service.spec.ts` — per-role required-field contract, step-write idempotency, finish-too-early returns 422 with correct missing-field list.
- `auth.controller.signup.e2e-spec.ts` — happy path customer, happy path welper, drop-and-resume (begin → step → state → step → finish), email-verification-during-wizard.
- `email-verified.guard.spec.ts` — gated endpoints return 403 when not verified, 200 when verified.

**Acceptance criteria**:
- New endpoints typed end-to-end via `@welpco/types`.
- Migration runs cleanly.
- All BFF gates green: type-check / lint / build / test.
- Pre-existing failures (admin, payment) untouched.

---

### Phase 2 — Web wizard surface

**Goal**: single multi-step wizard at `/register`, mobile-first, server-driven state.

**Deliverables**:
- New `/register` layout (`apps/web/app/(auth)/register/layout.tsx`) — wizard chrome (progress indicator, "Save and continue later" link, role-aware step labels).
- New `/register/page.tsx` — entry point that reads `useSignupState()` and routes to the right step.
- New `/register/step/[step]/page.tsx` — dynamic step route. Reads server state, renders the correct step component, submits to the corresponding BFF endpoint.
- Step components in `packages/ui/src/platform/user-management/signup-steps/`:
  - `email-password-step.tsx`
  - `select-role-step.tsx`
  - `identity-step.tsx` (firstName/lastName/phone via `libphonenumber-js`/dob/tos)
  - `welper-bio-step.tsx`
  - `welper-service-area-step.tsx` (uses `<ServiceAreaSelector>` from existing platform)
  - `welper-offering-step.tsx` (uses `<ServiceOfferingForm>`)
  - `welper-availability-step.tsx` (uses existing availability components)
  - `welper-payout-step.tsx` (Stripe Connect link or "skip — won't receive payments yet")
  - `notification-prefs-step.tsx`
  - `optional-profile-step.tsx` (photo + address)
- Hooks: `apps/web/lib/hooks/use-signup.ts` exposes `useSignupState`, `useBeginSignup`, `useCompleteSignupStep`, `useFinishSignup`. Single React Query store of truth.
- Delete old: `app/(auth)/register/page.tsx` (current role fork), `app/(auth)/register/customer/page.tsx`, `app/(auth)/register/welper/page.tsx`. Replaced by the wizard.
- Update `packages/ui/src/platform/user-management/welper-register-form.tsx` + `customer-register-form.tsx` — keep their primitives (field components), retire as standalone forms once wizard composes them.

**Mobile-first design pattern**:
- One focused task per screen; submit advances; "Back" preserves data.
- Progress indicator at top: "Step N of M" + visual bar.
- Form persists per-step server-side; "Save and continue later" closes the tab safely.
- Required-field markers (`*` + `aria-required` per bible §16.3 + `SEMANTIC_COLOR.danger`).
- Submit button at the bottom of each step's content area, full-width on mobile, sticky-bottom optional for long steps (welper bio + offering forms).
- Bible §22 voice on every step's title + helper text (warm, direct, competent).

**Tests**:
- `apps/web/e2e/auth/signup-wizard.spec.ts` — multi-step Playwright flow for both roles.
- Component tests on each step (input validation, error states, submit progression).

**Acceptance**:
- Web type-check / lint / build green.
- e2e covers happy path both roles + drop-and-resume + mobile viewport (375px).

---

### Phase 3 — Verification + middleware integration

**Goal**: enforce signup completion at the middleware level; let dashboard render with verification banner; gate bookable actions.

**Deliverables**:
- Update `apps/web/proxy.ts`: add the four-state machine described above. Existing `?next=` chain preserved (Wave 2 + Day 9).
- Add a verification banner component in `components/features/dashboard/verification-banner.tsx` — soft-color callout at top of dashboard when `emailVerified: false`. Click "Resend code" calls existing endpoint.
- Plumb the BFF `EmailVerifiedGuard`'s 403 code into the web error-handling layer: when a `bookableAction` returns 403 with `EMAIL_VERIFICATION_REQUIRED`, web shows a focused dialog ("Verify your email to confirm this booking") with resend-code action.

**Tests**:
- e2e: signup → keep using product → click verification email mid-flow → bookable action now succeeds.
- e2e: signup → bypass verification → try booking → 403 surfaced as dialog → click resend → flow recovers.

---

### Phase 4 — Onboarding-welcome deprecation

**Goal**: delete dead routes + components.

**Deliverables**:
- Delete `apps/web/app/(auth)/onboarding-welcome/` entirely.
- Delete `apps/web/lib/services/user-service.ts::markOnboardingCompleted` (or equivalent).
- Search + replace any `onboardingCompleted` reference in the web app — should now read from `signupCompleted`.
- Delete `OnboardingCustomerPreferencesStep`, `SetupCompletionStep`, `ProfileBasicsStep` if not consumed elsewhere (likely they ARE consumed in the new wizard's step components — keep them as primitives, drop only their orchestration).

**Tests**:
- e2e: full signup flow lands directly on dashboard after final step (no onboarding-welcome interstitial).

---

### Phase 5 — Test sweep + cross-feature regression

**Goal**: every existing flow that depended on the old "verified-not-onboarded" state still works; nothing left behind by deletion.

**Deliverables**:
- Run full BFF test suite + web e2e + manual smoke.
- Specifically re-test:
  - `LOGIN-002` regression: unverified-but-signed-up → dashboard with banner; bookable-action attempt → 403 dialog. Test that the "Invalid credentials" path is gone.
  - `proxy.ts` middleware four-state machine in all branches.
  - `?next=` redirect through wizard (welper signs up via "Become a Welper" link from welper profile → completes wizard → lands on the originating welper profile, not `/dashboard`).
  - Email-change reverification (`SETTINGS-001` ticket) — verify the new `EmailVerifiedGuard` doesn't break the change-email flow.

**Acceptance**:
- All tests green modulo pre-existing `admin.service.spec.ts` + `payment.service.spec.ts`.
- Pre-existing 5 failures unchanged (catalogued).
- Manual smoke: customer signup happy path, welper signup happy path, drop-and-resume, mobile (375px), verification timing.

---

### Phase 6 — Documentation + tickets reconciliation

**Goal**: update every reference to the old onboarding model.

**Deliverables**:
- `apps/web/AUDIT-LOG.md` — add "Day 15 — Signup ↔ onboarding merge" entry. Cover phases shipped, files deleted, contracts locked.
- `packages/ui/ui-ux-bible.md` — if §16 (forms) or §17 (states) reference onboarding flows, update for the new wizard pattern.
- `features/onboarding_features.md`:
  - Strike through `ONBOARDING-003` (subsumed; the wizard's required-field contract IS the fix).
  - Strike through `ONBOARDING-005` (no race — server-driven state).
  - Strike through `ONBOARDING-008` (no separate registration form to pre-fill from — wizard IS the registration).
  - Update `ONBOARDING-002` (phone parsing) — note it's resolved as part of the identity step's `libphonenumber-js` adoption.
  - Update `ONBOARDING-004` (silent profile-save failure) — note it's resolved by per-step server validation + structured error responses.
  - Add a note at the top of the file: "Most P0/P1 tickets in this file are architecturally subsumed by `SIGNUP_MERGE_PLAN.md`. Remaining tickets are post-launch polish."
- `features/login_features.md`:
  - Update `LOGIN-002`: note this is partially superseded — unverified users now reach the dashboard with a banner instead of being routed to `/verification`. The middleware-routes-to-`/verification` recommendation is replaced by the in-dashboard banner + bookable-action guard.
- `features/dashboard_features.md`:
  - Update `DASHBOARD-001`: note this gets simpler — fresh post-signup user lands on a dashboard with quick actions visible, since they now arrive with required fields filled. Empty-stats handling still needed but the wall-of-zeros problem is partially solved.
- `features/README.md`:
  - Update the index ticket counts.
  - Update Sprint 2 (Activation foundation): reframe around the merge instead of the standalone tickets.
  - Add a "Recent architectural changes" section pointing at this plan + the AUDIT-LOG Day 15 entry.

---

### Phase 7 — Verification + ship

**Goal**: a working signup wizard, end-to-end, both roles.

**Deliverables**:
- Run all gates: `pnpm --filter @welpco/bff type-check && lint && build && test`; `pnpm --filter @welpco/types build`; `pnpm --filter @welpco/ui build`; `pnpm --filter @welpco/web type-check && build`. (UI rebuild after platform additions per the precedent set in Day 11/12.)
- Manual smoke: full happy paths + drop-and-resume + mobile.
- Capture a short demo screencap (optional but useful for product review).
- Mark this plan complete in the README.

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Wizard step persistence races with email-verification-clicked-mid-flow | M | The wizard reads `GET /auth/signup/state` on every step entry, so even if `emailVerified` flips mid-step, the wizard doesn't care — it only cares about the role-conditional required-field contract. Verification timing is decoupled. |
| User completes signup but bookable action fails 403 unexpectedly | M | The 403 returns a structured code (`EMAIL_VERIFICATION_REQUIRED`) and the web layer translates it to a focused dialog. Not a generic 403. Tested in Phase 3. |
| Long welper signup (7-8 steps) drives mobile abandonment | M | Mitigations: short focused steps, persisted server-side, "save and continue later" affordance, clear progress indicator. Acceptance criteria includes 375px viewport tests. |
| Stripe Connect onboarding redirect breaks the wizard flow | M | Welper payout step uses a Stripe-hosted onboarding flow that returns the user to `/register/step/payout?stripe_status=…`. Wizard reads the status param + Stripe webhook eventually flips an internal flag. The step is skippable so the wizard isn't gated on Stripe success — Welper just can't receive payments without it. Surface clearly. |
| Existing user_accounts (test data) become broken | L | Drop them. The product is in development, no real production data. |
| `email_verified` semantics change vs current code | L | They don't — `email_verified` still means what it always meant ("user clicked the email link"). What changes is **what gets gated by it**. Move the gate from "can sign in" to "can perform bookable actions." Existing email-verification flow stays. |
| Welper double-registration (begin → drop → begin again with same email) | M | `POST /auth/signup/begin` is idempotent: if email exists with `signup_completed: false`, return the existing account's state. If `signup_completed: true`, return 409 (account exists, sign in). |

---

## Files map (anticipated; final tally tracked in AUDIT-LOG Day 15)

### New
- `apps/bff/src/domains/user-management/auth/signup-orchestrator.service.ts`
- `apps/bff/src/domains/user-management/auth/signup-orchestrator.service.spec.ts`
- `apps/bff/src/modules/auth/dto/begin-signup.dto.ts`
- `apps/bff/src/modules/auth/dto/select-role.dto.ts`
- `apps/bff/src/modules/auth/dto/identity-step.dto.ts`
- `apps/bff/src/modules/auth/dto/welper-bio-step.dto.ts` (etc., one per step)
- `apps/bff/src/modules/auth/dto/notification-prefs-step.dto.ts`
- `apps/bff/src/modules/auth/dto/finish-signup.dto.ts`
- `apps/bff/src/common/guards/email-verified.guard.ts`
- `apps/bff/src/domains/user-management/migrations/<timestamp>-AddSignupState.ts`
- `apps/bff/test/signup.e2e-spec.ts`
- `apps/web/app/(auth)/register/layout.tsx`
- `apps/web/app/(auth)/register/step/[step]/page.tsx`
- `apps/web/lib/hooks/use-signup.ts`
- `apps/web/components/features/dashboard/verification-banner.tsx`
- `apps/web/e2e/auth/signup-wizard.spec.ts`
- `packages/ui/src/platform/user-management/signup-steps/*` (one per step)

### Modified
- `apps/web/proxy.ts` — four-state machine.
- `apps/web/app/(auth)/register/page.tsx` — entry-point that resolves to the right step.
- `apps/web/lib/auth/providers.ts` — NextAuth + signup-state coupling (login should respect `signup_completed: false` and route to wizard).
- `apps/bff/src/modules/auth/auth.controller.ts` — new endpoints + `EmailVerifiedGuard` on bookable actions.
- `apps/bff/src/domains/user-management/auth/auth.service.ts` — login should not throw on unverified email; instead returns the user with `emailVerified: false` and lets the middleware route.
- `apps/web/AUDIT-LOG.md`, `features/{onboarding,login,dashboard}_features.md`, `features/README.md`, `packages/ui/ui-ux-bible.md` (if needed).

### Deleted
- `apps/web/app/(auth)/onboarding-welcome/` (entire route).
- `apps/web/app/(auth)/register/customer/page.tsx`, `apps/web/app/(auth)/register/welper/page.tsx` (replaced by wizard).
- BFF: nothing deleted — `onboardingCompleted` field stays as a deprecated alias of `signupCompleted` (DB-side rename pending), or repurposed.

---

## Sprint execution order

If executing as a single linear sprint:

1. **Phase 0** (planning approval) — half day.
2. **Phase 1** (BFF) — 2-3 days.
3. **Phase 2** (web wizard) — 3-4 days.
4. **Phase 3** (verification + middleware) — 1 day.
5. **Phase 4** (cleanup) — half day.
6. **Phase 5** (regression sweep) — 1 day.
7. **Phase 6** (docs + tickets) — half day.
8. **Phase 7** (final verify + ship) — half day.

**Total**: roughly 9-11 days for one focused contributor (or 5-6 days with two working in parallel — Phase 1 BFF and Phase 2 web can overlap once the DTOs are locked).

If parallel agent execution: Phase 1 + Phase 2 dispatched together once Phase 0 is approved (one BFF agent, one web agent, both reading the same locked contracts in this doc). Phase 3+ sequential.

---

## How "done" looks

- A new visitor lands on `/`, clicks "Become a Welper", goes through 7 wizard steps, lands on a dashboard where they can immediately set their availability and receive booking requests.
- A new visitor clicks "Find a Welper", goes through 3 wizard steps, lands on search-ready dashboard.
- An existing partial-signup user signs in, is automatically routed to the next step they need.
- An unverified user can browse the dashboard but can't create bookings (focused dialog explains).
- The Welper "wall of zeros" dashboard problem (`DASHBOARD-001`) is structurally solved for fresh accounts.
- `features/onboarding_features.md` has 3-4 tickets crossed out, 1-2 marked as "polish" in priority.
- The codebase has one signup flow, not two.
