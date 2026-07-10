# Dashboard home — open tickets

> **Validation: 2026-07-04** — every ticket below re-verified against the implementation at commit `b809feb`. Status tags: ✅ SHIPPED · 🟢 STILL OPEN · 🟡 PARTIAL · ⚫ OBSOLETE · ❓ UNVERIFIED.

Source: Day 14 onboarding-welcome + dashboard home functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 2 P2/P3 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Onboarding: `features/onboarding_features.md` — `ONBOARDING-001` (CTA label) and `ONBOARDING-008` (pre-fill) directly affect the post-onboarding landing on this page.
- Booking: `features/booking_features.md` — `bookings` is the only data source feeding stats + activities + the state line; all dashboard freshness is downstream of the booking-list endpoint.
- Notifications: `features/notifications_features.md` — `NOTIFICATIONS-001` (every-domain emit) is the missing input for a "Needs your attention" callout that names something the BFF didn't already surface in bookings.
- Reviews / disputes: `features/reviews_features.md`, `features/disputes_features.md` — neither feeds the dashboard today (`DASHBOARD-005`).

---

## Shipped in the Day 14 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day14-D-01 | P2 | `recent-activity.tsx` (web — dashboard) | `activity.user.name[0].toUpperCase()` would throw `TypeError: Cannot read properties of undefined` for any activity whose `user` is set but `name` is empty. Now `(activity.user.name?.trim()?.[0] ?? "?").toUpperCase()` — fallback to `?` matches the Avatar contract elsewhere. (Crash never observed in practice because `buildDashboardActivities` never sets `user`, but the contract is now safe — see DASHBOARD-002.) |
| Day14-D-02 | P3 | `quick-actions.tsx` (web — dashboard) | `aria-label` joined label + description with em-dash; some screen readers literally announce "em dash". Switched to a period — `"Find a Welper. Browse and book."` reads naturally. |

---

## DASHBOARD-001 — Fresh post-onboarding user lands on a dashboard that promises and shows nothing

**[🟡 PARTIAL — verified 2026-07-04]** — setup checklists + `hideDashboardExtras` now suppress quick actions/stats until Section A completes (`apps/web/app/(dashboard)/dashboard/page-client.tsx:186-188,315`), but once past that gate a fresh user still sees zero stat tiles and no first-run hero exists.

**Partially resolved (2026-05-06)** — the signup-merge guarantees fresh users
arrive at the dashboard already-onboarded (Welper has bio + service area + ≥1
offering + availability; Customer has identity + prefs). The "wall of zeros"
problem is structurally addressed for fresh accounts: welpers no longer land
incomplete, and customers land with prefs set. The remaining concern is
empty-stats handling (e.g. fresh Welper has no completed bookings yet, so the
"Total earnings: $0" tile still reads as a dead-end). Re-tiered P0 → P2 since
the most-load-bearing failure (no quick actions, no useful state) is now
structurally fixed. See `features/SIGNUP_MERGE_PLAN.md` + AUDIT-LOG Day 15.

- **Priority**: ~~P0~~ → **P2** (post-merge: empty-stats polish only)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`
- **Problem**: User completes onboarding → redirected to `/dashboard`. State of the world at that moment:
  - Customer: 0 bookings, 0 favorites, 0 messages, 0 notifications.
  - Welper: 0 jobs, 0 reviews, profile incomplete (per ONBOARDING-003).
  Today's dashboard renders:
  - State line: "No upcoming bookings — find a Welper to get started." (✓ honest)
  - Profile-incomplete callout (✓ correct for welper).
  - Three quick actions, identical regardless of state.
  - Stats grid with 4 zero-tiles.
  - Recent activity empty state with one CTA tile.
  The fresh user sees four flavors of "nothing here yet" stacked vertically: callout (sometimes), zero-tiles, recent-activity-empty. Bible §22.6: don't apologize for emptiness, propel forward. Quick actions buried below the zero-tiles is a primacy mistake — the new customer should see "Find a Welper" first, not "Active bookings: 0" first.
- **Proposed solution**: detect first-run state (no bookings AND no favorites AND no messages within last 30 days) and render a different IA:
  - One-tile hero: "Welcome to Welpco — let's find your first Welper" with a primary CTA.
  - Skip stats + recent-activity entirely (drop the four "0" tiles).
  - For welpers: "Welcome to Welpco — finish setting up your profile so customers can find you" with a primary CTA to the profile tabs that need work.
  After the user's first booking / job, the standard layout (state line + callout + actions + stats + activity) takes over.
- **Acceptance criteria**:
  - First-run customer sees the hero, no zero-tiles.
  - First-run welper sees the profile-completion hero.
  - Returning user (any history) sees the standard layout.
  - Tests: snapshot for first-run state per role; existing layout still passes.
- **Effort**: M.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`, `apps/web/components/features/dashboard/first-run-hero.tsx` (new).

---

## DASHBOARD-002 — Recent-activity items never render an avatar (data shape lies)

**[⚫ OBSOLETE — verified 2026-07-04]** — the dashboard no longer mounts `RecentActivity` (it renders `RecentNotifications`, `apps/web/app/(dashboard)/dashboard/page-client.tsx:333`); `buildDashboardActivities` has zero callers, so the never-set `user` field is dead code, not a live bug (cleanup candidate: `recent-activity.tsx` + `buildDashboardActivities`).

- **Priority**: P1 (visual polish + correctness)
- **Area**: `apps/web/lib/dashboard/booking-dashboard.ts`, `recent-activity.tsx`
- **Problem**: `DashboardActivityItem` declares `user?: { name: string; image?: string }` — implying activity rows show the counterparty. `buildDashboardActivities` never sets `user`. The avatar branch in `recent-activity.tsx:36` is dead. The list reads as a wall of plain text rows where bookings should clearly attribute to a person — bible §22.6: a marketplace where strangers transact is built on faces.
- **Proposed solution**: extend `BookingItem` (BFF + FE) with a hydrated counterparty (`customer` for welper-side, `welper` for customer-side) carrying `{ id, name, profilePhotoUrl }`. The booking-list endpoint already joins to user/profile tables — surface the resolved fields. `buildDashboardActivities` then sets `user: role === 'customer' ? { name: b.welper.name, image: b.welper.profilePhotoUrl } : { name: b.customer.name, image: b.customer.profilePhotoUrl }`.
- **Acceptance criteria**:
  - Each activity row shows an avatar with the counterparty's photo + first-letter fallback.
  - BFF booking-list response includes hydrated counterparty fields.
  - Tests: row renders avatar; falls back to letter when no photo.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/booking/booking.service.ts` (or response DTO), `apps/web/lib/services/booking-service.ts`, `apps/web/lib/dashboard/booking-dashboard.ts`.

---

## DASHBOARD-003 — Welper-side stats omit the metrics that matter (rating, reviews, response time)

**[🟢 STILL OPEN — verified 2026-07-04]** — `computeWelperStatsFromBookings` still renders only Active/Earnings/Completed and its "BFF doesn't surface a welper-aggregate rating yet" comment is now stale (`apps/web/lib/dashboard/booking-dashboard.ts:132-139`): `GET /api/profiles/me` DOES hydrate `averageRating` / `reviewCount` / `responseTimeMinutes` via `apps/bff/src/domains/profile-management/welper-profile/welper-profile.service.ts` `hydrate()`.

- **Priority**: P1 (welper retention)
- **Area**: `apps/web/lib/dashboard/booking-dashboard.ts:102-117` + `apps/web/app/(dashboard)/dashboard/page-client.tsx`
- **Problem**: The welper sees three tiles: Active jobs, Total earnings, Completed jobs. The numbers that drive their *standing in the marketplace* (averageRating, reviewCount, responseTimeMinutes — Wave 1 trust signals) are missing. The Day 4 audit log explicitly notes "Welper 'Rating' stat tile dropped when no honest data (bible §22.6)" — but Wave 1 shipped real data. The hydrated welper profile (`/api/profiles/me` for welpers) includes `averageRating`, `reviewCount`, `responseTimeMinutes`. The dashboard isn't reading those fields.
- **Proposed solution**: page-client passes `welperProfile` into stats compute. New stats array (welper, when data is present):
  - Active jobs (existing)
  - Total earnings (existing)
  - Average rating: "4.8 / 5 (24 reviews)" — only render when `reviewCount >= 1`; bible §22.6 honest threshold.
  - Response time: e.g. "Avg 12 min" — only render when `responseTimeMinutes` is set.
  Drop "Completed jobs" tile (it duplicates the "Total earnings" implication and isn't a leverage metric for the welper to optimize).
- **Acceptance criteria**:
  - Welper with reviews sees rating + response-time tiles.
  - Welper with no reviews still sees Active jobs + Total earnings (no fake placeholders).
  - Tests: zero-reviews state + with-reviews state.
- **Effort**: S.
- **Files**: `apps/web/lib/dashboard/booking-dashboard.ts`, `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-004 — Stats use the most-recent 50 bookings only; "Total spent" / "Total earnings" understate for power users

**[🟢 STILL OPEN — verified 2026-07-04]** — stats are still summed client-side over page 1 / limit 50 (`BOOKINGS_DASHBOARD_LIMIT` at `apps/web/app/(dashboard)/dashboard/page-client.tsx:36`, compute at lines 158-170, pagination footnote at 178-184); no BFF dashboard-aggregate endpoint exists (`apps/bff/src/modules/` has no dashboard module).

- **Priority**: P1 (financial honesty)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx:34, 100-103`
- **Problem**: `BOOKINGS_DASHBOARD_LIMIT = 50`; the dashboard pulls page 1 limit 50. `computeCustomerStatsFromBookings` sums `totalPrice` over those 50. A loyal customer with 60 bookings sees "Total spent" = sum of last 50 — silently understated. The footnote "Counts use your X most recent bookings — open Bookings for the full list." is honest but easy to miss. Bible §22.6: money honesty. The aggregator endpoint should compute totals across ALL bookings, not just page 1.
- **Proposed solution**: BFF exposes `/api/dashboard/me` (new) returning `{ activeBookings, totalSpent, completedCount, favoriteCount }` for customers and `{ activeJobs, totalEarnings, completedCount, averageRating, reviewCount, responseTimeMinutes }` for welpers — computed server-side over the full booking history. FE replaces the hand-rolled compute with the endpoint.
- **Acceptance criteria**:
  - Aggregates are correct regardless of booking count.
  - The footnote about pagination disappears (or only shows on the bookings list page).
  - BFF endpoint covered by a unit test with 60+ bookings.
- **Effort**: M.
- **Files**: new `apps/bff/src/modules/dashboard/dashboard.controller.ts` + `dashboard.service.ts`, `apps/web/lib/services/dashboard-service.ts` (new), `apps/web/lib/dashboard/booking-dashboard.ts`, `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-005 — Recent activity only shows bookings (messages, reviews, disputes, notifications all silent here)

**[✅ SHIPPED — verified 2026-07-04]** — shipped via different means: the dashboard replaced the booking-only activity list with `RecentNotifications` (`apps/web/components/features/dashboard/recent-notifications.tsx`, mounted at `page-client.tsx:333`), fed by the notifications module that the booking, communication (messages), review, dispute, and payment domains all emit into.

- **Priority**: P1 (information density)
- **Area**: `apps/web/lib/dashboard/booking-dashboard.ts`, `recent-activity.tsx`
- **Problem**: `DashboardActivityItem.type` is hardcoded `"booking"`. A user who got a 5-star review yesterday, sent a message this morning, and had a refund processed last week sees ONLY booking status changes here. The "Recent activity" heading is honest by being narrow but lonely by being incomplete.
- **Proposed solution**: extend `DashboardActivityItem.type` to `"booking" | "message" | "review" | "dispute" | "payment"`. The new BFF dashboard endpoint (DASHBOARD-004) returns a unified activity feed sorted by `createdAt` desc with per-type display fields. Cap at 8. Reuse the existing row component with a small icon-medallion per type.
- **Acceptance criteria**:
  - All five domains contribute to the feed.
  - Each row links to the right detail page.
  - Tests: feed mixes types correctly; ordering correct.
- **Effort**: M (depends on `NOTIFICATIONS-001` being done OR a separate aggregator query — recommend the aggregator since the notification system is half-built).
- **Files**: same as DASHBOARD-004.

---

## DASHBOARD-006 — `aria-live="polite"` on the stats wrapper announces every fetch

**[🟢 STILL OPEN — verified 2026-07-04]** — `<Box aria-busy={loading || undefined} aria-live="polite">` still wraps the entire stats section (`apps/web/components/features/dashboard/dashboard-stats.tsx:90`).

- **Priority**: P2 (a11y)
- **Area**: `apps/web/components/features/dashboard/dashboard-stats.tsx:89`
- **Problem**: `<Box aria-busy={loading || undefined} aria-live="polite">` wraps the section heading + grid. Every refetch triggers a polite announcement that re-reads "Your activity" + every stat tile. With React Query polling every 30s elsewhere on the page, screen reader users get hammered. Bible §17 + WCAG 4.1.3.
- **Proposed solution**: scope the live region to a small status-only node (e.g., a visually-hidden `<span aria-live="polite">{loading ? "Loading dashboard stats" : ""}</span>` adjacent to the heading). Drop `aria-live` from the wrapper. `aria-busy` stays.
- **Acceptance criteria**: refetches do not re-announce stats; only loading transitions announce.
- **Effort**: XS.
- **Files**: `apps/web/components/features/dashboard/dashboard-stats.tsx`.

---

## DASHBOARD-007 — Profile-completion callout copy diverges between customer + welper

**[✅ SHIPPED — verified 2026-07-04]** — shipped via replacement: the dual-source callout code is gone from `page-client.tsx`; both roles now render BFF-driven setup checklists (`useCustomerSetupChecklist` / `useWelperSetupChecklist` → `CustomerSetupChecklist` / `WelperSetupChecklist` in `apps/web/app/(dashboard)/dashboard/page-client.tsx:307-313`) as the single completion source.

- **Priority**: P2 (consistency)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx:105-164`
- **Problem**: Customer side computes `isProfileIncomplete` from `customerProfile.profileCompletionStatusLabel !== "Complete"` (BFF-defined) AND a parallel hand-rolled `completion` step list (used only for the "X of Y steps done" copy). The two sources can disagree — BFF says complete; FE step list says 4/5 because favorites isn't required. The callout says "Finish your profile — 4 of 5 steps done." but isn't shown if `profileCompletionStatusLabel === "Complete"`. Welper-side bypasses the BFF label entirely and uses the FE step list. Two sources of truth, two different code paths.
- **Proposed solution**: single source of truth = BFF `profileCompletionStatus`. Welper-profile already computes it. Customer-profile should expose the same shape (`profileCompletionStatus: 'complete' | 'incomplete'` + `profileCompletionStatusLabel`). The dashboard reads the label, drops the FE step list, and the callout copy becomes role-agnostic: "Finish your profile so customers (or you) can do X."
- **Acceptance criteria**:
  - Single source of truth.
  - Customer + welper callout copy mirrors structure.
  - Tests: complete state → no callout; incomplete state → callout with right copy.
- **Effort**: S.
- **Files**: `apps/bff/src/domains/profile-management/customer-profile/customer-profile.service.ts`, `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-008 — No needs-attention callout for actionable booking states (welper has pending; customer has unconfirmed)

**[🟢 STILL OPEN — verified 2026-07-04]** — pending jobs still surface only in the plain-text state line (`welperHome.pendingJobs(...)` in `apps/web/app/(dashboard)/dashboard/page-client.tsx:198-215`); no warning Callout and no customer-side pending/awaiting-payment surfacing exists.

- **Priority**: P2 (information surfacing)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx:140-158`
- **Problem**: The welper's "X jobs need your answer" lives in the *state line under the greeting*, not as a Callout. State line is plain text — no CTA, no urgency cue. Bible §22.6: when something needs the user's action, it should look actionable. Customer side has nothing equivalent (no "Your booking with Jane is waiting on her acceptance" surfacing — they have to open `/dashboard/bookings`).
- **Proposed solution**: add a needs-attention Callout (`color={SEMANTIC_COLOR.warning}`) above the quick actions when:
  - Welper: `pendingForWelper > 0` → "X jobs need your answer." with primary CTA "Review jobs".
  - Customer: bookings with status `pending` (welper hasn't accepted) older than 24h → "Your booking with X is still waiting." with CTA "Check status".
  - Customer: a booking with status `awaiting_payment` → "Finish your booking with X" with CTA "Pay now".
  Rule: callout shows ONLY when actionable. Empty cases mean no callout (not "everything is great").
- **Acceptance criteria**:
  - Each rule fires when the data matches and not otherwise.
  - Callouts stack in priority order (payment > acceptance > pending).
  - Tests cover each branch.
- **Effort**: M.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`, possibly `apps/web/lib/dashboard/booking-dashboard.ts` for the rule helpers.

---

## DASHBOARD-009 — Skeleton loader doesn't match real layout (callout, stats, activity placeholders missing)

**[🟡 PARTIAL — verified 2026-07-04]** — stats tiles and notifications skeleton in-shape (`dashboard-stats.tsx` StatCard skeleton; `recent-notifications.tsx:99-106`), but the whole extras block (quick actions + stats + notifications) is unmounted until the setup checklist resolves (`hideDashboardExtras`, `page-client.tsx:188,315`), so first paint still doesn't mirror the final layout.

- **Priority**: P2 (perceived perf)
- **Area**: `apps/web/components/features/dashboard/dashboard-stats.tsx`, `recent-activity.tsx`, `apps/web/app/(dashboard)/dashboard/page-client.tsx`
- **Problem**: Stats grid renders skeleton rectangles in real tile shells. Activity gets a skeleton list. But the page-client itself doesn't skeleton: heading + state line render with text "Loading your dashboard…" while the rest pops in beneath as data arrives. The user sees the heading first → blank → callout → tiles → activity. Bible §17.5: skeleton should mirror the final shape so layout doesn't shift.
- **Proposed solution**: page-client wraps the entire content in a single layout shell. While `bookingsLoading || profileLoading`, render skeleton placeholders for the callout (a 56px-tall surface card), the quick actions (3 tile-shaped skeletons), the stats grid, and the activity card. State line reads as today.
- **Acceptance criteria**:
  - First paint shows the full layout shape.
  - Cumulative layout shift score drops.
  - Lighthouse perf check.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-010 — Error state when BFF returns 5xx is invisible (silently shows zero stats)

**[🟢 STILL OPEN — verified 2026-07-04]** — `page-client.tsx:142-148` still destructures only `{ data, isLoading }` from `useBookings` (`isError` unused; the hook adds no error surfacing either), so a 5xx still computes all-zero stats with the "no upcoming bookings" state line and no error callout.

- **Priority**: P2 (transparency)
- **Area**: `apps/web/lib/hooks/use-bookings.ts` consumer (`page-client.tsx`)
- **Problem**: `useBookings` returns `{ data, isLoading, isError }`. The dashboard reads only `data` + `isLoading`. On 5xx, `data` is `undefined`, `bookings` is `[]`, stats compute to all-zeros, the state line says "No upcoming bookings — find a Welper to get started." The user thinks they have nothing; really the BFF is broken. Bible §17.5: what / why / what-to-do.
- **Proposed solution**: surface a banner Callout when `bookingsResponse` errors:
  > "We couldn't load your dashboard data. (Network or server error.) Try refreshing in a moment."
  with a Refresh button that re-runs the query. Stats + activity collapse to skeleton until either data arrives or the user retries.
- **Acceptance criteria**:
  - 5xx renders the error callout, not zero-stats.
  - Manual retry works without page reload.
  - Tests: mocked failure → callout renders.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-011 — Customer payment-missing branch is suppressed when other steps are complete

**[✅ SHIPPED — verified 2026-07-04]** — the coupled callout code was deleted; payment is now collected as its own wizard step (`customerPayment` in `apps/web/app/[locale]/(auth)/register/step-name-utils.ts`) and surfaced independently as the checklist's `bookingPayment` section (`apps/web/lib/dashboard/customer-setup-groups.ts:67-75`), regardless of other profile completeness.

- **Priority**: P2 (booking activation)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx:129-164`
- **Problem**: `isProfileIncomplete` for customer = `profileCompletionStatusLabel !== "Complete"`. `customerPaymentMissing` = `!hasDefaultPaymentMethod`. The "Add a payment method so you can book" copy ONLY renders if `isProfileIncomplete && customerPaymentMissing`. If a customer has full name + phone + address but no payment method AND the BFF marks them complete (which it might), the payment-missing nudge never shows. They first discover the missing payment method when they click "Book" on a welper page and get a 4xx.
- **Proposed solution**: separate the two concerns — render the payment-missing callout independently of the profile-incomplete callout. Stack them when both apply.
- **Acceptance criteria**:
  - Payment-missing callout shows whenever `!hasDefaultPaymentMethod`, regardless of profile completeness.
  - Both callouts can stack visually.
  - Tests: each combination of (profile complete | incomplete) × (payment present | missing).
- **Effort**: XS.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-012 — `firstNameOf` falls back to email local-part with dots / numbers ("john.smith42")

**[🟢 STILL OPEN — verified 2026-07-04]** — the `email.split("@")[0]` fallback survives at `apps/web/app/(dashboard)/dashboard/page-client.tsx:52-57` (largely mitigated in practice: the greeting now prefers profile `firstName`, which the wizard's identity step requires, so the fallback is a rare path — consider downgrading).

- **Priority**: P3 (microcopy)
- **Area**: `apps/web/app/(dashboard)/dashboard/page-client.tsx:46-52`
- **Problem**: User has not set a name → fallback is `email.split("@")[0]`. For `john.smith42@gmail.com`, the dashboard greets "Welcome back, john.smith42." Bible §22.6: voice. Better to just say "Welcome back." with no name, or "Hi there." Don't pretend to know the user when we don't.
- **Proposed solution**: when `name` is empty, drop the name from the greeting → "Welcome back." (no comma, no email-prefix). When `name` is set, use it.
- **Acceptance criteria**:
  - Empty name → "Welcome back."
  - Set name → "Welcome back, Jane."
- **Effort**: XS.
- **Files**: `apps/web/app/(dashboard)/dashboard/page-client.tsx`.

---

## DASHBOARD-013 — No e2e coverage for the dashboard home

**[🟡 PARTIAL — verified 2026-07-04]** — `apps/web/e2e/dashboard/dashboard.spec.ts` (+ `dashboard-i18n.spec.ts`) now exists and covers customer-side smoke (content after login, greeting, completion status, stats load, callout navigation), plus `e2e/auth/registration.spec.ts` asserts both roles land on the dashboard with a setup checklist — but there is no welper-specific dashboard spec and no loading-shape/empty-state coverage from the AC.

- **Priority**: P2 (quality gate)
- **Area**: `apps/web/e2e/`
- **Problem**: There is no Playwright spec for `/dashboard`. The most-load-bearing screen has no end-to-end test. Customer + welper layouts, the loading states, the empty states, the callouts — none verified.
- **Proposed solution**: add `apps/web/e2e/dashboard/dashboard-customer.spec.ts` and `…/dashboard-welper.spec.ts`. Cover:
  - First-paint loading state mirrors layout.
  - Empty state: zero bookings → state-line copy + activity empty card both render.
  - With data: state line names the right number; stats tiles populate.
  - Callout shows when profile incomplete; hides when complete.
  - Quick-action click navigates to the right route.
- **Acceptance criteria**: both specs run green; cover the five scenarios above.
- **Effort**: M.
- **Files**: new e2e specs.

---

## Suggested execution bundles

### Bundle A — Honesty (the four "the dashboard is lying" bugs)
DASHBOARD-001 (first-run), DASHBOARD-004 (stats over full history), DASHBOARD-010 (5xx error state), DASHBOARD-012 (greeting fallback).
Each is a bible §22.6 trust contract violation. Together they make the dashboard tell the truth about what it knows.

### Bundle B — Information surfacing (welper stats, attention callouts, multi-domain activity)
DASHBOARD-003 (welper trust signals), DASHBOARD-005 (multi-domain activity), DASHBOARD-008 (needs-attention callout), DASHBOARD-002 (avatar in activity).
Sequenced after Bundle A — needs the new BFF dashboard endpoint (DASHBOARD-004).

### Bundle C — Polish + a11y + tests
DASHBOARD-006 (aria-live), DASHBOARD-007 (callout consistency), DASHBOARD-009 (skeleton matches), DASHBOARD-011 (payment-missing independence), DASHBOARD-013 (e2e specs).
Smaller, ships in any order. DASHBOARD-013 should follow Bundles A + B so the e2e specs lock the new behaviour.
