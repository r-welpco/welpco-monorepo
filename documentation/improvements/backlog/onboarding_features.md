# Onboarding-welcome — open tickets

> **Validation: 2026-07-04** — every ticket below re-verified against the implementation at commit `b809feb`. Status tags: ✅ SHIPPED · 🟢 STILL OPEN · 🟡 PARTIAL · ⚫ OBSOLETE · ❓ UNVERIFIED.

> **Architectural note (2026-04-29 → shipped 2026-05-06)**: most P0/P1 tickets
> in this file have been **shipped via** `features/SIGNUP_MERGE_PLAN.md`. The
> signup ↔ onboarding merge replaced the standalone post-login onboarding flow
> with a unified multi-step signup wizard. The standalone `/onboarding-welcome`
> route, the `markOnboardingComplete` mutation, and the legacy register-form
> private components were deleted in Dispatch C (2026-05-06). Tickets marked
> **[SHIPPED]** below were resolved by the merge. Tickets without that marker
> are post-launch polish items still open. See `apps/web/AUDIT-LOG.md` Day 15
> for the full deletion / modification list.

Source: Day 14 onboarding-welcome + dashboard home functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 4 P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Dashboard: `features/dashboard_features.md` — onboarding's last step lands on `/dashboard`; `DASHBOARD-001` (first-time fresh-user state) keeps that landing honest.
- Login: `features/login_features.md` — `LOGIN-002` (unverified login routes to "Invalid credentials") still blocks the legitimate path that drops a verified user onto onboarding-welcome on first sign-in.
- Settings: `features/settings_features.md` — onboarding writes `firstName / lastName / phoneNumber` via `PUT /api/profiles/me`; the same endpoint backs the profile settings tab.

---

## Shipped in the Day 14 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day14-O-01 | P2 | `setup-completion-step.tsx` (platform) | Heading "🎉 You're all set!" wrapped emoji in `<span aria-hidden="true">` so screen readers announce only "You're all set!" — emoji-as-heading was double-announced as "party popper" before the meaningful word. Also escaped the apostrophe to `&rsquo;` for typographic consistency with the rest of the platform copy. |
| Day14-O-02 | P2 | `profile-basics-step.tsx` (platform) | Phone field had `autoComplete="tel"` only; mobile keyboards opened the alphanumeric keyboard. Added `type="tel"` + `inputMode="tel"` so the dial-pad opens on iOS / Android. |
| Day14-O-03 | P2 | `onboarding-customer-preferences-step.tsx` (platform) | The "Categories you are interested in" heading marked the field required only with a visual asterisk hidden from screen readers (`aria-hidden="true"`). Added literal "(required)" in the label, wrapped the checkbox column in `role="group"` with `aria-labelledby` + `aria-required="true"` so AT users get the same affordance sighted users do. |
| Day14-O-04 | P2 | `quick-actions.tsx` (web — dashboard) | `aria-label` joined label + description with em-dash; some screen readers literally announce "em dash". Switched to a period — `"Find a Welper. Browse and book."` reads naturally. (Cross-surface fix shipped under onboarding because the same pattern is used on the post-onboarding landing.) |

---

## ONBOARDING-001 — `?next=` deep-link target gets an unbranded "Go to dashboard" CTA

**[⚫ OBSOLETE — verified 2026-07-04]** — the completion-CTA screen was deleted with the legacy flow; the wizard's finish page auto-redirects through `safeNextPath(nextRaw)` with no mislabeled button (`apps/web/app/[locale]/(auth)/register/finish/finish-page-client.tsx`); `setup-completion-step.tsx` is no longer mounted anywhere in apps/web.

- **Priority**: P1 (activation)
- **Area**: `setup-completion-step.tsx` + `onboarding-welcome/page.tsx`
- **Problem**: A new user who clicks "Book this Welper" on a marketing page is sent through register → verify → `/onboarding-welcome?next=/dashboard/booking/new?welperId=…`. After completing onboarding the final-step CTA reads "Go to dashboard" but the actual `router.push(nextPath)` lands them on the booking flow. Bible §22.6 honesty: button copy must match the action. We promised them they could finish their booking; the button calls it "dashboard".
- **Proposed solution**: thread an optional `ctaLabel` (and matching `ctaSublabel`) prop through `InitialSetupWorkflow` → `SetupCompletionStep`. The page computes label from `nextRaw`:
  - `/dashboard/booking/new` → "Continue your booking"
  - `/dashboard/search` → "Find a Welper"
  - `/dashboard/profile` → "Open your profile"
  - default `/dashboard` → "Go to dashboard"
- **Acceptance criteria**:
  - Page-client picks the right label based on `safeNextPath`.
  - Default unchanged (regression-safe).
  - Tests: each branch covered with a mock `nextRaw`.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/setup-completion-step.tsx`, `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## **[SHIPPED]** ONBOARDING-002 — Phone input has no validation feedback or country-code parsing

**[✅ SHIPPED — verified 2026-07-04]** — confirmed: client and server both validate via `libphonenumber-js` (`packages/ui/src/platform/user-management/signup-steps/identity-step.tsx`; `apps/bff/src/modules/auth/dto/identity-step.dto.ts` explicitly notes "Closes ONBOARDING-002").

**Shipped (2026-05-06)** — addressed in signup-merge: the wizard's identity step (`packages/ui/src/platform/user-management/signup-steps/identity-step.tsx`) parses + validates phone with `libphonenumber-js`, normalizes to E.164 at submit, and the BFF re-validates server-side. See AUDIT-LOG Day 15.



- **Priority**: P1 (data quality)
- **Area**: `profile-basics-step.tsx` + `onboarding-welcome/page.tsx:107-119`
- **Problem**: The schema gates on `phone.length >= 7`. The page-client then runs a hand-rolled `match(/^\+(\d{1,3})/)` to extract a country code, defaults to `+1` if none, and slices the prefix off the digits. A user who types `(555) 000-1234` (no country code, formatted) gets `countryCode = "+1"` (correct guess) but `number = "5550001234"` (correct). A user who types `+44 20 1234` gets `countryCode = "+44"` and `number = "201234"` — only 6 digits, and the schema didn't notice because length-of-string was 11 with formatting. The PUT to `/api/profiles/me` then ships a malformed `PhoneNumber` object. Bible §22.6: tell users what's going to happen — we silently coerce bad input.
- **Proposed solution**: replace the hand-roll with `libphonenumber-js`. Parse on submit; reject formatted-but-invalid numbers inline with "Enter a valid phone number, e.g., +1 (555) 000-0000." Store the normalized E.164 + country code.
- **Acceptance criteria**:
  - Empty / too-short / unparseable numbers fail validation inline.
  - Country code derived from the parsed number (no `+1` default).
  - PUT `/api/profiles/me` always receives a valid E.164 + country code.
  - Test coverage for `+1`, `+44`, `+33`, no-country-code, partial.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/profile-basics-step.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## ~~ONBOARDING-003 — Welper has only one onboarding step (profile basics) — no service offerings, no availability, no bio, no photo~~

**[✅ SHIPPED — verified 2026-07-04]** — confirmed: welper wizard steps `welperBio` / `welperServiceArea` / `welperOffering` / `welperAvailability` / `welperBackgroundCheck` / `welperPayout` exist (`apps/web/app/[locale]/(auth)/register/step-name-utils.ts`; `POST /auth/signup/step/*` in `apps/bff/src/modules/auth/auth.controller.ts`) and `signup/finish` 422-gates required fields.

**Shipped (2026-05-06)** — resolved via signup-merge architecture. The wizard's role-conditional required-fields contract (welper now has bio + service-area + ≥1 service offering + availability + payout choice + notification prefs + optional photo, all server-validated before `signupCompleted: true` flips) IS the fix. See `features/SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15.



- **Priority**: P0 (welper activation)
- **Area**: `initial-setup-workflow.tsx` + new welper-specific steps
- **Problem**: `steps` for welper = `["welcome", "profile", "completion"]`. Profile basics collects firstName / lastName / phone — that's it. After completion the welper lands on `/dashboard` with `profileCompletionStatus = INCOMPLETE` (BFF requires bio + serviceArea + at least one active service offering). The dashboard's "Finish your profile" callout is the sole nudge. A welper who completes onboarding cannot receive bookings because:
  - No bio → public profile shows only the name.
  - No service offerings → search filters return them with empty `services`.
  - No availability → booking form sees no slots.
  - No service area → location-based search excludes them.
  Bible §22.6: we promised "Let's set up your Welper profile so customers can find and book your services." The flow doesn't deliver on that promise. Activation rate = welper-profile-complete / welper-signups; this is the biggest leverage point on that ratio.
- **Proposed solution**: extend the welper sequence to `["welcome", "profile", "service-area", "service-offering", "availability", "completion"]`. Each new step writes its slice incrementally so a tab close mid-flow doesn't lose progress. Use the existing platform components:
  - service-area: lightweight version of `ServiceAreaInput` (city + 2-3 zip codes).
  - service-offering: a single first offering using `ServiceOfferingSchema` with reasonable defaults (1 hour, hourly rate).
  - availability: 3 default time blocks (Mon-Fri 9-5) the welper can adjust later.
  Hide the bio + photo upload from onboarding (defer to dashboard) — onboarding stays under 3 minutes.
- **Acceptance criteria**:
  - Welper completes onboarding with `profileCompletionStatus = COMPLETE`.
  - Each step's data persists incrementally (resume on tab close).
  - Skip-out marks `onboardingCompleted=true` but profile stays INCOMPLETE — dashboard callout drives the rest.
  - Tests: full happy-path + skip-on-each-step.
- **Effort**: L.
- **Files**: `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`, new `service-area-step.tsx`, new `service-offering-step.tsx`, new `availability-step.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## **[SHIPPED]** ONBOARDING-004 — Profile-step save failures are swallowed (user thinks they saved, server has empty profile)

**[✅ SHIPPED — verified 2026-07-04]** — confirmed: each wizard step posts to its own BFF endpoint, and `INCOMPLETE_SIGNUP` / `missingFields` errors are surfaced inline (`apps/web/app/[locale]/(auth)/register/finish/finish-page-client.tsx` Callout `role="alert"`); no swallow-and-advance path remains.

**Shipped (2026-05-06)** — addressed in signup-merge: each wizard step submits to its own BFF endpoint with structured 422 errors (`IncompleteSignupErrorBody` / DTO validation) surfaced inline; no "advance with empty server state" path remains. See AUDIT-LOG Day 15.



- **Priority**: P1 (data integrity)
- **Area**: `apps/web/app/(auth)/onboarding-welcome/page.tsx:128-137`
- **Problem**: The `handleStepComplete` profile branch wraps the PUT in `try { … } catch (err) { console.error(…) }` — explicit comment says "Don't block onboarding flow if profile save fails. Log error but don't throw - user can update profile later." The user advances to the next step, eventually completes onboarding, and discovers in `/dashboard/profile` that their name + phone are blank. Bible §22.6: silent failure is the worst kind. The PR comment justifies it as "user can update profile later" — but the user doesn't KNOW to update it later because we didn't tell them.
- **Proposed solution**: surface the error inline on the step. Disable Continue + show an error callout: "We couldn't save your profile — please try again. (Network error.)" Retry button. If the second retry also fails, allow progress with a banner on the next step: "Your profile didn't save — finish here, then update from your dashboard."
- **Acceptance criteria**:
  - Failed PUT shows inline error.
  - User can retry without losing form state.
  - On second failure, user can continue with a clearly visible warning banner.
  - Tests: 401 → redirect to login (existing); 5xx → inline retry; network error → inline retry.
- **Effort**: S.
- **Files**: `apps/web/app/(auth)/onboarding-welcome/page.tsx`, `packages/ui/src/platform/user-management/profile-basics-step.tsx`.

---

## ~~ONBOARDING-005 — `markOnboardingComplete()` race vs `?next=` redirect~~

**[✅ SHIPPED — verified 2026-07-04]** — confirmed: server-owned `signupCompleted` drives routing in `apps/web/proxy.ts` (~lines 167-171) and the finish page awaits the session update before `router.replace(safeNextPath(...))` — no 100ms-timeout heuristic remains. (Note: `markOnboardingComplete` still exists BFF-side in `apps/bff/src/modules/profiles/profiles.service.ts` but the web app no longer calls it.)

**Shipped (2026-05-06)** — resolved via signup-merge architecture. Server-driven state eliminates the race entirely: the wizard's `useFinishSignup` mutation triggers a session refresh that reads the freshly-flipped `signupCompleted: true` from the BFF before the client-side `router.push(nextPath)` fires; the middleware's four-state machine handles the routing authoritatively if the JWT is still in flight. See `features/SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15.



- **Priority**: P1 (correctness)
- **Area**: `onboarding-welcome/page.tsx:163-244`
- **Problem**: The complete handler does:
  1. `await updateSession()` (next-auth refresh)
  2. `await getAccessToken()`
  3. `await markOnboardingComplete()` (BFF write)
  4. `setUser({...user, onboardingCompleted: true})` (Zustand)
  5. `await updateSession({user: {...emailVerified, onboardingCompleted}})` (next-auth merge)
  6. `await new Promise((r) => setTimeout(r, 100))` (the magic-100ms-delay)
  7. `router.push(nextPath)`
  The 100ms delay is a heuristic for "let the session propagate." On slow connections the proxy-middleware sees `onboardingCompleted=false` from the still-stale JWT and redirects back to `/onboarding-welcome`, which now shows… the welcome step again. The user is caught in a soft loop until the JWT actually updates. Day 3 audit log notes "Edge case: user closes the tab mid-onboarding — next sign-in re-lands on onboarding-welcome." This is a different bug — the JWT and the BFF are momentarily out of sync.
- **Proposed solution**: BFF returns the new JWT (or refresh-token signal) in the `markOnboardingComplete` response body. Page-client either:
  a. Calls `signIn` with the new token (preferred), or
  b. Polls the session refresh in a small while-loop until `onboardingCompleted=true` lands, then redirects.
  Option (b) is simpler; option (a) is more correct.
- **Acceptance criteria**:
  - On slow connections (3G simulated), the post-completion redirect lands on `nextPath` first try.
  - No back-and-forth between `/onboarding-welcome` and the JWT-refreshing dance.
  - Tests: integration test that sets a 1s artificial delay between BFF write + JWT refresh, asserts no loop.
- **Effort**: M.
- **Files**: `apps/web/app/(auth)/onboarding-welcome/page.tsx`, `apps/bff/src/modules/profiles/profiles.controller.ts`, `apps/bff/src/modules/profiles/profiles.service.ts`, `apps/web/auth.ts` (JWT callback).

---

## ONBOARDING-006 — Customer preferences step blocks on empty `/api/content/categories` instead of degrading

**[⚫ OBSOLETE — verified 2026-07-04]** — `onboarding-customer-preferences-step.tsx` has zero imports in apps/web (dead export in `packages/ui/src/platform/user-management/index.ts`); the wizard has no service-category preferences step (`apps/web/app/[locale]/(auth)/register/step-name-utils.ts`).

- **Priority**: P2 (graceful degradation)
- **Area**: `onboarding-customer-preferences-step.tsx`
- **Problem**: The component handles `categories.length === 0` with a Callout "Service categories are not available yet" and a Continue button that submits an empty array. But if `useContentCategories()` returns `isError` (network drop, BFF down), the page-client passes `[]` to the step which then renders the "not available yet" copy. The user thinks the platform isn't ready; really the BFF is down. Bible §17.5: tell what / why / what-to-do.
- **Proposed solution**: thread `categoriesError: boolean` through `InitialSetupWorkflow` → `OnboardingCustomerPreferencesStep`. When `categoriesError`, render an error Callout with "We couldn't load service categories — you can pick them later from your profile." Continue still works (sends empty array).
- **Acceptance criteria**:
  - Network error renders distinct copy from "not available yet".
  - Continue still moves the user forward (don't block onboarding on a non-fatal read).
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/user-management/onboarding-customer-preferences-step.tsx`, `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## ONBOARDING-007 — Skip flow has no path (welcome step's "Skip for now" never wired)

**[⚫ OBSOLETE — verified 2026-07-04]** — `welcome-step.tsx` is no longer mounted anywhere in apps/web (wizard opens with the select-role step); the unused `onSkip` branch is now a dead-component-cleanup concern, not a flow fix.

- **Priority**: P2 (UX consistency)
- **Area**: `welcome-step.tsx` + `onboarding-welcome/page.tsx`
- **Problem**: `WelcomeStep` accepts an optional `onSkip` prop and renders "Skip for now" if provided. The page-client never passes `onSkip`, so the button is never rendered. The optional prop and unused branch is dead code. Either wire it (skip onboarding entirely → mark complete → redirect to `nextPath`) or remove the prop.
- **Proposed solution**: option A (wire it): page-client passes `onSkip={async () => { await markOnboardingComplete(); router.push(nextPath); }}`. Option B (remove): drop `onSkip` from props; the welper sequence will become longer per ONBOARDING-003 and "Skip for now" loses meaning. Recommend **Option B** — onboarding is short and a Skip button trains the user to expect skips elsewhere.
- **Acceptance criteria** (Option B):
  - `onSkip` prop removed from `WelcomeStep` + `InitialSetupWorkflow`.
  - No render branch for the Skip button.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/user-management/welcome-step.tsx`, `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`.

---

## ~~ONBOARDING-008 — Profile-basics step doesn't pre-fill from registration form data~~

**[✅ SHIPPED — verified 2026-07-04]** — confirmed: `CustomerRegisterForm` / `WelperRegisterForm` have zero usages in apps/web; the wizard (`apps/web/app/[locale]/(auth)/register/`) IS the registration, so there is no duplicate data entry.

**Shipped (2026-05-06)** — resolved via signup-merge architecture. There is no separate registration form to pre-fill from; the wizard IS the registration. See `features/SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15.



- **Priority**: P2 (DRY)
- **Area**: `onboarding-welcome/page.tsx` + register flow
- **Problem**: The customer + welper register forms (`customer-register-form.tsx`, `welper-register-form.tsx`) collect firstName + lastName + phone (welper) or just email + password (customer) before account creation. After verification → onboarding the user re-types the same firstName + lastName + phone. We have the data; we don't pass it forward. Bible §22.6: don't ask for the same thing twice.
- **Proposed solution**: registration writes to `customer_profiles.firstName` / `welper_profiles.firstName` (already does for some flows). Onboarding's profile-basics step pre-fills `defaultValues` from `useCustomerProfile` / `useWelperProfile`. If the BFF already has firstName/lastName/phone, skip the profile step entirely.
- **Acceptance criteria**:
  - Profile-basics step pre-fills from existing profile data.
  - If all three fields are non-empty on mount, the step auto-advances after `markStepComplete`.
  - Tests: full pre-fill + partial pre-fill + empty.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/profile-basics-step.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## ONBOARDING-009 — Heading hierarchy skips h2 (h1 → h3 inside the workflow card)

**[⚫ OBSOLETE — verified 2026-07-04]** — all four named step components (`welcome-step.tsx`, `profile-basics-step.tsx`, `onboarding-customer-preferences-step.tsx`, `setup-completion-step.tsx`) are unmounted legacy code; their heading order can't trip axe-core on any live page.

- **Priority**: P3 (a11y)
- **Area**: `welcome-step.tsx`, `profile-basics-step.tsx`, `onboarding-customer-preferences-step.tsx`, `setup-completion-step.tsx`
- **Problem**: The welcome + completion steps render `<Heading size="7">` with default `as="h1"`. The intermediate steps render `<Heading as="h3" size="3">`. Skipping h2 trips axe-core's `heading-order` rule. The card itself is the only landmark.
- **Proposed solution**: change intermediate step headings to `as="h2"` with `size="5"` (matches dashboard's `Your activity` heading rhythm). Welcome + completion stay h1.
- **Acceptance criteria**: axe-core passes; visual rhythm preserved.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/user-management/profile-basics-step.tsx`, `packages/ui/src/platform/user-management/onboarding-customer-preferences-step.tsx`.

---

## ONBOARDING-010 — `nextPath` not surfaced to the user mid-flow

**[🟢 STILL OPEN — verified 2026-07-04]** — the concern transfers to the wizard: `?next=` is threaded through every step (`apps/web/app/[locale]/(auth)/register/step/[step]/step-page-client.tsx:67,127`) but never displayed to the user; ticket file paths need re-targeting from the deleted onboarding pages to the register wizard.

- **Priority**: P3 (transparency)
- **Area**: `onboarding-welcome/page.tsx`
- **Problem**: When `?next=/dashboard/booking/new?welperId=…`, the user's intent (book this welper) is lost behind the workflow chrome. After 3 steps they may forget what they came for. Bible §22.6 trust: remind them.
- **Proposed solution**: above the progress bar, when `nextRaw` is non-default, render a small "Returning to: Book a Welper after setup" line. Resolve a human-readable label from the next path (similar to ONBOARDING-001).
- **Acceptance criteria**:
  - `nextRaw` non-default → contextual label visible.
  - Default `/dashboard` → no extra line.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`, `apps/web/app/(auth)/onboarding-welcome/page.tsx`.

---

## ONBOARDING-011 — No e2e coverage for the onboarding flow

**[✅ SHIPPED — verified 2026-07-04]** — `apps/web/e2e/auth/registration.spec.ts` covers customer + welper wizard happy paths, drop-and-resume, `?next=` post-signup routing, and the middleware four-state machine; the legacy `apps/web/e2e/onboarding/onboarding-flow.spec.ts` is `test.describe.skip` against the deleted flow (cleanup candidate).

- **Priority**: P2 (quality gate)
- **Area**: `apps/web/e2e/`
- **Problem**: There is no Playwright spec for `/onboarding-welcome`. Day 3 polish + Day 14 fixes are unverified end-to-end. Login + verification + register specs exist; the flow stitching them together does not.
- **Proposed solution**: add `apps/web/e2e/onboarding/onboarding-customer.spec.ts` and `…/onboarding-welper.spec.ts`. Cover:
  - Verified-but-not-onboarded customer signs in → redirected to `/onboarding-welcome` → completes all 3 steps → lands on `/dashboard`.
  - `?next=/dashboard/search` honored.
  - 401 mid-flow redirects to login with `next=/onboarding-welcome` preserved.
  - Profile-basics validation (empty firstName, short phone).
- **Acceptance criteria**: both specs run green in CI; cover the four scenarios above.
- **Effort**: M.
- **Files**: new e2e specs.

---

## ONBOARDING-012 — Welcome step's "What we'll set up" list is misleading for welpers

**[⚫ OBSOLETE — verified 2026-07-04]** — `welcome-step.tsx` is unmounted; the wizard has no "What we'll set up" list (it opens with the select-role step, and role-specific steps are enumerated by the server-owned `requiredSteps` in `step-name-utils.ts`).

- **Priority**: P3 (microcopy)
- **Area**: `welcome-step.tsx`
- **Problem**: For welpers the list shows only "Basic profile information" — one bullet, no preferences (welpers don't have a preferences step). After ONBOARDING-003 ships, the list will be wrong because welpers will go through service-area + service-offering + availability. Even today, "Basic profile information" undersells the importance — a welper who skips here ends up with an empty profile and zero bookings.
- **Proposed solution**: depend the list on the steps array. Each step contributes a bullet:
  - Customer: "Basic profile information" + "Your service preferences"
  - Welper (post ONBOARDING-003): "Basic profile information" + "Where you serve" + "Your services" + "Your availability"
- **Acceptance criteria**: list mirrors the step sequence per role.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/user-management/welcome-step.tsx`, `packages/ui/src/platform/user-management/initial-setup-workflow.tsx`.

---

## Suggested execution bundles

### Bundle A — Activation (welper-onboarding completeness)
ONBOARDING-003 (welper steps), ONBOARDING-008 (pre-fill), ONBOARDING-012 (welcome list).
This is the highest-leverage change in the whole audit. A welper who completes onboarding today cannot receive a booking; after this bundle they can.

### Bundle B — Correctness (data + race)
ONBOARDING-002 (phone validation), ONBOARDING-004 (silent profile-save failure), ONBOARDING-005 (JWT race), ONBOARDING-006 (categories error state).
Together these close the four "the user thinks it worked but it didn't" loopholes.

### Bundle C — UX polish + a11y + tests
ONBOARDING-001 (CTA label), ONBOARDING-007 (kill skip-for-now), ONBOARDING-009 (heading order), ONBOARDING-010 (next-path breadcrumb), ONBOARDING-011 (e2e specs).
Smaller, ships in any order. ONBOARDING-011 should follow Bundles A + B so the e2e specs lock the new behaviour.
