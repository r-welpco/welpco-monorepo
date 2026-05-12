# Booking + search — open tickets

Source: Day 11 booking + search functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 6 P1/P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Auth surface: `features/login_features.md` — booking flow assumes a working email-verified, payment-method-attached customer (LOGIN-002 unverified path; SETTINGS-001 email-change reverification).
- Settings surface: `features/settings_features.md` — payment-method gating (`profileCompletionStatusLabel === "Complete"`) lives there; SETTINGS-003/004 phone + postal validation feed booking address validation.

---

## Shipped in the Day 11 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day11-01 | P1 | WelperProfileCardCompact + WelperProfileCard | "0.0 ★" rendered when `reviewCount === 0` was a fake social-proof claim (bible §22.6). Now rating is gated on BOTH `rating > 0` AND `reviews > 0`; zero-review welpers show "No reviews yet" — same line the welper profile hero uses (Day 7 Wave 1). Added `reviews` prop to compact card; wired from search results. |
| Day11-02 | P1 | Bookings list (`bookings/`) | Replaced `window.confirm` (accept) and `window.prompt` (decline + cancel) with the canonical `<ActionConfirmDialog>` primitive (Day 2 Phase 2 introduced it; the list page was missed in that pass). Dialog descriptions follow bible §17.5 + §22 voice. Welper-for-PENDING no longer shows duplicate "Decline" + "Cancel" — Decline is the semantically correct verb at PENDING, Cancel is hidden when Decline is available. |
| Day11-03 | P1 | Bookings list — status tabs | Added `Declined` and `Disputed` tabs. Without them, a customer with a disputed/declined booking had no way to filter to it (bible §17.3). |
| Day11-04 | P1 | BFF `CreateBookingRequestDto` | `durationMinutes` was `@Min(15)` only — accepted any value above (a typo / AM-PM mix-up could create a 24h+ booking that the booking detail UI can't render and the receipt flow can't bill cleanly). Now `[15, 720]` (15 min – 12 h). FE wizard mirrors the bound with explicit inline errors. |
| Day11-05 | P2 | BFF `CreateBookingRequestDto` | `notes` was unbounded `@IsString()` — anyone hitting the API directly could store a 100K-char block. Now `@MaxLength(2000)`. FE wizard adds a character counter + `maxLength=2000` cap. |
| Day11-06 | P1 | Booking wizard summary panel + booking detail cancel dialog | Cancellation policy was nowhere visible at booking time, and the cancel-confirm dialog said "Cancelling near the start time may release the payment hold" — vague + technically wrong (MVP doesn't charge late fees, and the hold IS released regardless). Now: wizard summary explicitly states "Your card is held — not charged — when the welper accepts. You're only charged after the service is completed. Free cancellation any time before the service starts." Cancel dialog mirrors. Bible §22.6 trust contract. |

---

## WELPER-PAYOUTS-001 — Stripe Connect onboarding round-trip (welper-payout step)

- **Priority**: P1 (welpers can't earn until this lands; signup wizard ships with a placeholder).
- **Area**: BFF payments + signup wizard welper-payout step.
- **Problem**: The signup wizard's `welper-payout-step` (`packages/ui/src/platform/user-management/signup-steps/welper-payout-step.tsx`, shipped Day 15 Dispatch B) renders the "Set up payouts" CTA disabled with "coming soon" copy. The skip path is fully wired (submits `{ skip: true }` and the orchestrator records the choice), so welpers can finish the wizard and reach the dashboard, but they can't actually receive payments. Real Stripe Connect onboarding was deferred from the merge to keep the merge atomic.
- **Proposed solution**:
  - New BFF endpoint `POST /payments/connect/account-link` returning a Stripe Connect AccountLink URL (`type: 'account_onboarding'`, `return_url: /register/step/welper-payout?stripe_status=success`, `refresh_url: /register/step/welper-payout?stripe_status=refresh`).
  - Stripe webhook handler for `account.updated` flips `welper_profiles.stripe_onboarding_completed` once the connected account has `details_submitted: true` AND `charges_enabled: true` AND `payouts_enabled: true`.
  - `welper-payout-step.tsx` enables the primary CTA, hits the new endpoint, opens the URL in a new tab, polls `GET /auth/signup/state` while the tab is open, and advances the wizard once the orchestrator reports `stripeOnboardingCompleted: true`. The skip path is preserved as the secondary action.
  - `EmailVerifiedGuard` is NOT applied to the connect endpoint — Stripe Connect onboarding is itself a sensitive action and Stripe verifies the welper independently.
- **Acceptance criteria**:
  - Welper clicks "Set up payouts with Stripe" → Stripe-hosted form opens in a new tab → completes the Stripe form → returns to the wizard → `stripeOnboardingCompleted: true` flips and the step finishes.
  - Welper clicks "Skip for now" → still works; warning callout reminds them they can't receive payments yet; wizard advances.
  - A welper who skipped at signup can revisit `/dashboard/settings?tab=payment` (NEW tab for welpers) and start the same Connect flow there.
- **Effort**: M-L.
- **Files**: `apps/bff/src/domains/payment/stripe-connect.service.ts` (new), `payment.controller.ts` (new endpoint), `payment.module.ts`, `welper_profiles` migration (new `stripe_onboarding_completed` column), Stripe webhook handler (`apps/bff/src/domains/payment/stripe-webhook.controller.ts` or new), `packages/ui/src/platform/user-management/signup-steps/welper-payout-step.tsx`, `apps/web/lib/services/payment-service.ts`.
- **Tracking**: Logged Day 15 Dispatch C as the closing-out item from the signup-merge plan. See `features/SIGNUP_MERGE_PLAN.md` + `apps/web/AUDIT-LOG.md` Day 15.

---

## BOOKING-001 — Welper double-booking prevention via slot reservation

- **Priority**: P1 (highest leverage; user-visible race)
- **Area**: BFF booking flow + booking wizard
- **Problem**: Two customers can race to book the same welper for the same time window. Today's defence is `checkConflictsInTransaction` — it counts overlapping bookings whose status is in `(PENDING, ACCEPTED, IN_PROGRESS)` and rejects with 400. That works once a row exists, but a booking sat in the wizard for 15 min while a second customer hit "Confirm and pay" on the same slot leaks one of them a 400 error at the worst possible moment. There's also a second race: between welper-accept and the BFF's `authorizeHoldBeforeWelperAccept` call, a customer cancellation can land — code handles it but the welper sees an opaque 400.
- **Proposed solution**: 15-minute "soft hold" in Redis (`reservation:welper:<welperId>:<date>:<startTime>-<endTime>` → `customerId`, TTL 15 min). Wizard claims the hold on first time-window edit (or on selecting the welper if `?slot=` was passed in); release on submit-success or wizard-abandon. POST /bookings checks the hold matches the customer before creating.
- **Acceptance criteria**:
  - Two customers entering the same wizard for the same slot: the first to start gets the hold; the second sees "This slot was just claimed by another customer — try a nearby time" with a list of suggested adjacent windows.
  - Hold expires automatically; closing the wizard releases it sooner.
  - The accept-vs-cancel race surfaces a clearer error than today's "no longer pending."
- **Effort**: M.
- **Files**: `apps/bff/src/domains/booking/booking.service.ts` (claim + release endpoints), new `slot-reservation.service.ts`, web wizard (`booking/new/page-client.tsx`), `apps/bff/src/domains/booking/booking.controller.ts` (POST /bookings/reserve, DELETE /bookings/reserve).

---

## BOOKING-002 — Reschedule flow (don't make people cancel-and-rebook)

- **Priority**: P1
- **Area**: BFF + booking detail
- **Problem**: The only way to change a date/time today is "Cancel + create a new booking". That releases the payment hold, sends two notifications, and treats the old booking as a failure even when the customer just had a schedule shift. For the welper it's worse — every rescheduled job costs them a fresh accept-and-hold cycle.
- **Proposed solution**: `PATCH /bookings/:id/reschedule` with new date/time. Customer initiates → welper must accept the new times before the change applies. Status briefly transitions to `RESCHEDULE_PENDING` (new state) and back to `ACCEPTED` on welper confirm. Conflict check runs against the new times. Payment hold stays in place (auth amount unchanged unless the new duration changes the total — handled by the existing `captureForServiceReceipt` delta logic).
- **Acceptance criteria**:
  - Customer can submit a new date/time on an `ACCEPTED` booking; welper sees the request inline; accept commits; decline reverts to original.
  - Push notifications + emails on every transition.
  - Payment hold is not recreated unless the dollar total changes.
  - Tests cover the state-machine extension + the reschedule-confirm vs reschedule-decline branches.
- **Effort**: L.
- **Files**: `apps/bff/src/domains/booking/booking-state-machine.ts` (new state), `apps/bff/src/domains/booking/booking.service.ts`, `apps/bff/src/domains/booking/dto/reschedule-booking.dto.ts` (new), web booking detail action row, new `<RescheduleDialog>`.

---

## BOOKING-003 — Concurrent-acceptance UX: live status updates on booking detail

- **Priority**: P1
- **Area**: Web booking detail + BFF
- **Problem**: When a welper accepts a booking, the customer's open booking-detail page does not update without a manual refresh. The status badge sits at "Pending welper acceptance" until the user reloads. For a marketplace where money + trust flow on time, this is a trust gap.
- **Proposed solution** (preferred): Server-Sent Events (SSE) endpoint `GET /bookings/:id/events` — pushes status changes (accepted, declined, checked_in, completed, cancelled). Client subscribes when the booking-detail page mounts and the booking is in a transitional state; closes when status is terminal. Fallback: TanStack Query `refetchInterval` of 10s while the booking is in `PENDING` or `ACCEPTED`.
- **Acceptance criteria**:
  - Customer sees the welper's accept within ~5s without refresh; same for decline / cancel.
  - Connection auto-reconnects on transient network drops.
  - No connection thrash when the page is backgrounded (use Page Visibility API).
  - Tests: integration — accept on welper side, observe customer-side cache update.
- **Effort**: M (SSE) or S (poll fallback).
- **Files**: `apps/bff/src/domains/booking/booking.controller.ts` (new SSE endpoint), `apps/bff/src/domains/booking/booking-events.service.ts` (new pub-sub), web `useBookingById` hook.

---

## BOOKING-004 — Pending-booking TTL (auto-decline after 24h)

- **Priority**: P2
- **Area**: BFF booking flow
- **Problem**: A booking can sit in `PENDING` indefinitely. Welper never sees the request (notifications failed); welper ignores it. Today the conflict-check counts PENDING bookings as occupying the slot — so the welper's calendar is silently blocked for any future booking on that slot until something else changes the status. No automatic expiry.
- **Proposed solution**: Cron job (or BullMQ scheduler) that sweeps `PENDING` bookings older than 24h, transitions them to `DECLINED` with `declineReason = "auto_declined_no_response"`, releases the hold (none yet at PENDING — but defensive). Email both parties: "We declined this booking on {welperName}'s behalf because they didn't respond in 24h. Try another welper."
- **Acceptance criteria**:
  - Pending booking older than 24h → status flips to DECLINED with the canonical reason.
  - Notification fires to both customer and welper.
  - Audit log written.
  - Tests cover the boundary (23.99h pending — left alone; 24.01h — auto-declined).
- **Effort**: M.
- **Files**: New `apps/bff/src/domains/booking/booking-expiry.scheduler.ts`, `booking.module.ts`.

---

## BOOKING-005 — Honest "relevance" sort in search

- **Priority**: P2
- **Area**: BFF service-discovery
- **Problem**: `apps/bff/src/domains/service-discovery/service-discovery.service.ts:241` — when `sort === 'relevance'`, the order-by clause is `created_at DESC`. Newest welpers show first regardless of how good they are. The label "relevance" implies better-matched welpers come first; the implementation lies.
- **Proposed solution**: when `q` is provided, rank by ILIKE-match strength (per-column, weighted name > bio > offering description) using `pg_trgm`'s `similarity()`. When `q` is absent, rank by review credibility: `LOG(review_count + 1) * rating + COALESCE(verified::int, 0) * 0.5` then `created_at DESC` as the tiebreak. This rewards established + verified welpers without burying new ones (logarithmic decay).
- **Acceptance criteria**:
  - Search "Maria" returns welpers literally named Maria first; bio matches second; offering description matches third.
  - No-query browse returns highly-reviewed verified welpers above zero-review newcomers.
  - New welpers (zero reviews) still appear in pagination, just not in position 1.
  - Tests cover the three branches (q present, q absent, mixed).
- **Effort**: M.
- **Files**: `apps/bff/src/domains/service-discovery/service-discovery.service.ts`, search migrations (already-TODO'd `pg_trgm` GIN indexes).

---

## BOOKING-006 — Cancellation-fee policy: design + ship

- **Priority**: P2 (product call)
- **Area**: BFF + booking detail + booking wizard
- **Problem**: `booking.service.ts` has `FREE_CANCELLATION_HOURS = 24` and a `// MVP: late cancellations are logged only; fees not charged` comment. So today the policy is: free cancellation, always. That's customer-friendly but punishes welpers who block their calendar for a no-show. Day 11 fix Day11-06 made the copy honest about this. The proper policy is product's call.
- **Proposed solution** (one option): "Free up to 24h before. After 24h: 50% of the agreed total goes to the welper, refunded from the hold; the customer keeps the other half." Show this in the cancel-confirm dialog dynamically: "Cancelling now: 50% fee ($X.XX). Free until {date 24h before start}." When implemented, also surface in the wizard summary so customers know before they confirm.
- **Acceptance criteria**:
  - Cancel-confirm dialog shows the live fee preview.
  - BFF charges the fee on cancel (capture half the hold, void the rest).
  - Customer + welper notifications include the fee breakdown.
  - Tests: ≥24h free; <24h fee charged; concurrent cancel + accept handled.
- **Effort**: L (legal/policy review + implementation + e2e).
- **Files**: `apps/bff/src/domains/booking/booking.service.ts`, `apps/bff/src/domains/payment/payment.service.ts`, web wizard summary, web cancel dialog.

---

## BOOKING-007 — Form persistence (draft saving for the booking wizard)

- **Priority**: P2
- **Area**: Booking wizard
- **Problem**: A user fills the wizard, gets distracted, browser crashes / refresh, comes back — every field empty. For a multi-question + date + time + notes wizard, that's a real abandonment hit.
- **Proposed solution**: persist the in-flight wizard state to `sessionStorage` on every change (debounced 500ms). On mount, hydrate from sessionStorage if `welperId` matches. Clear on successful submit or "Back to search".
- **Acceptance criteria**:
  - Refreshing the wizard preserves all fields including answers.
  - Switching to a different welper clears the previous draft.
  - Drafts older than 24h are evicted on next mount.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/booking/new/page-client.tsx`, new `apps/web/lib/hooks/use-booking-draft.ts`.

---

## BOOKING-008 — Recurring-bookings wired to the wizard

- **Priority**: P2
- **Area**: Booking wizard + BFF
- **Problem**: `<RecurringBookingForm>` exists in `packages/ui/src/platform/booking-scheduling/recurring-booking-form.tsx` but isn't wired to the wizard. For the kinds of services welpco sells (childcare, tutoring, home care), recurring is the high-leverage flow — once-off bookings are the exception.
- **Proposed solution**: wizard gets a "Repeat" toggle below the date/time block. When on, expands the recurring-booking-form (frequency, end date, occurrences). On submit, BFF creates N booking rows in one transaction (or a parent + children pattern — TBD by what reschedule + cancel of a single instance vs. the series should do).
- **Acceptance criteria**:
  - Customer can book "Every Tuesday at 4pm for 8 weeks".
  - Conflicts on any future occurrence surface before commit.
  - Cancelling one instance leaves the rest intact; cancelling the series cancels all future ones.
  - Tests cover series creation + single-instance cancellation.
- **Effort**: L.
- **Files**: BFF new domain or extension, `<RecurringBookingForm>` integration in wizard, BFF booking entity (parent_booking_id?).

---

## BOOKING-009 — "Book again" from past booking detail

- **Priority**: P2
- **Area**: Booking detail
- **Problem**: A completed booking is a strong signal that this customer-welper pair worked; the friction to repeat that booking should be near zero. Today the only path is search → welper profile → wizard.
- **Proposed solution**: on a `COMPLETED` booking detail page, add a "Book again" CTA in the Actions row that opens the wizard pre-filled with the same offering + same notes + the next available open slot.
- **Acceptance criteria**:
  - Click "Book again" on a completed booking → wizard opens with offering, notes pre-filled; date defaults to "next slot in 7 days" (welper's default availability).
  - Customer can edit anything before confirming.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx`, wizard accepts `?from=<bookingId>`.

---

## BOOKING-010 — Welper response-time SLA visible in the wizard

- **Priority**: P2
- **Area**: Booking wizard
- **Problem**: Wave 1 ships `responseTimeMinutes` on the public welper profile (null when reviewCount < 5 — bible §22.6). The booking wizard doesn't surface it. The customer hits "Confirm and pay" with no idea whether they'll wait 5 minutes or 5 days for the welper to accept.
- **Proposed solution**: in the wizard summary panel, when `responseTimeMinutes != null`, show "Most welpers respond within {humanReadable(responseTimeMinutes)}." Use the same null-safe logic as the welper profile hero.
- **Acceptance criteria**:
  - Welper with `responseTimeMinutes = 12` shows "responds within 15 minutes" (rounded up to next quarter-hour).
  - Welper with `responseTimeMinutes = null` shows nothing (no faux-precise claim).
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/booking/new/page-client.tsx`.

---

## BOOKING-011 — Search saved searches + recent searches

- **Priority**: P3
- **Area**: Search
- **Problem**: Users in this market type the same query repeatedly ("babysitter near 90210"). Re-typing every time is friction.
- **Proposed solution**: `localStorage`-backed recent searches (last 5), shown as chips below the SearchHero. Saved searches (named, sync via BFF if logged in) are a Phase 2.
- **Acceptance criteria**:
  - After searching, the query appears in a "Recent" row; clicking re-runs it.
  - "Clear recent searches" link below.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/search/page-client.tsx`, new `apps/web/lib/hooks/use-recent-searches.ts`.

---

## BOOKING-012 — Pre-tip / post-tip flow

- **Priority**: P3 (product call)
- **Area**: BFF + booking detail
- **Problem**: No tip flow today. For service workers, tips are a meaningful part of comp.
- **Proposed solution** (preferred): post-completion tip prompt in the booking-detail page. Customer can add 0/10/15/20% or custom. Captured as a separate Stripe charge from the saved card; transferred to the welper.
- **Acceptance criteria**:
  - After receipt is sent, the customer sees "Add a tip?" with preset chips.
  - Tipping is optional and can be added up to 7 days post-completion.
  - Welper sees tip total in their dashboard.
- **Effort**: L.
- **Files**: BFF payment domain, web booking detail.

---

## BOOKING-013 — Welper notification when customer is en route to wizard

- **Priority**: P3
- **Area**: Search + welper notifications
- **Problem**: A welper has no idea anyone's looking at their profile. Surfacing "X people viewed your profile in the last 24h" can drive engagement (welpers respond faster when they know there's interest).
- **Proposed solution**: aggregate profile views (anonymously); show in the welper dashboard. Phase 2: notify on a high-intent signal (entered the wizard for ≥30s without submitting).
- **Acceptance criteria**:
  - Welper sees a "Profile views: 23 this week" tile in their dashboard.
  - No PII leak (don't show which customer).
- **Effort**: M.
- **Files**: BFF telemetry domain (new), welper dashboard.

---

## BOOKING-014 — E2E coverage for booking + search flows

- **Priority**: P2
- **Area**: Tests
- **Problem**: `apps/web/e2e/` has zero booking/search specs. Auth + settings + onboarding + availability + profile all have e2e coverage. Money + trust both flow through booking and there's no end-to-end safety net.
- **Proposed solution**: add `apps/web/e2e/search/search.spec.ts` (location prompt, postal-code submit, filter changes, pagination) and `apps/web/e2e/booking/booking-wizard.spec.ts` (welper selected → service picked → date/time → confirm → lands on detail page → cancel → status updates). Reuse `loginAsCustomer` / `loginAsWelper` fixtures.
- **Acceptance criteria**:
  - Search spec: 5 scenarios (location prompt, valid postal, invalid postal recovers, filter persists across pagination, mobile sheet opens).
  - Booking spec: 4 scenarios (happy path, profile-incomplete gate, time validation error, cancel from detail).
- **Effort**: M.
- **Files**: `apps/web/e2e/search/search.spec.ts` (new), `apps/web/e2e/booking/booking-wizard.spec.ts` (new), shared fixture extension if needed.

---

## BOOKING-015 — Receipt-evidence file upload in the welper check-out dialog

- **Priority**: P2
- **Area**: Welper check-out flow
- **Problem**: Receipt evidence files are wired in the BFF (Wave 2) and rendered on the customer side (`<ReceiptEvidenceSection>`), but the welper's `<DialogContent title="Confirm service receipt">` doesn't expose any upload UI. So the only way evidence gets attached today is via API/admin — no welper-facing path.
- **Proposed solution**: add a multi-file uploader to the receipt dialog (mirroring the dispute evidence upload pattern). Files upload to S3 via presigned PUT before submit; the receipt POST includes the keys.
- **Acceptance criteria**:
  - Welper can attach 0–5 evidence files (images + PDF) to a receipt.
  - Upload progress visible; total <25MB.
  - Customer sees the attached files in the receipt section after submit.
- **Effort**: M.
- **Files**: `apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx` (receipt dialog), BFF `submitServiceReceipt` extension if needed.

---

## BOOKING-016 — Schedule visualization in the booking wizard

- **Priority**: P3
- **Area**: Booking wizard
- **Problem**: Today the customer types a date + start time + end time and submits. If the slot's not in the welper's availability or conflicts with another booking, they get a 400 after-the-fact. No visual guide.
- **Proposed solution**: surface the welper's availability as a calendar with green / grey slots; clicking a slot fills date+time. Conflict-checked client-side before submit.
- **Acceptance criteria**:
  - Customer sees only valid slots.
  - Mobile: collapsed to a date-picker + time-list.
- **Effort**: L.
- **Files**: New platform component (or wire the existing `<BookingCalendar>`), wizard.

---

## BOOKING-017 — Welper service-area accuracy: distance display on search cards

- **Priority**: P3
- **Area**: Search results
- **Problem**: Search filters by service-area distance (BFF earth_distance with welper radius), but the result card shows a static `location` like "CA, QC" with no distance from the customer. The customer can't tell which of two welpers in the same city is closer.
- **Proposed solution**: when a search point is provided (postal or geolocation), the BFF response includes `distanceKm` per result; the cards render "{title} · {city} · 4.2 km away".
- **Acceptance criteria**:
  - Distance is honest (haversine from search point to welper centre).
  - Sort-by-distance still ranks correctly.
- **Effort**: S.
- **Files**: BFF `searchServices`, FE search cards.

---

## BOOKING-018 — `accept` idempotency response shape

- **Priority**: P3
- **Area**: BFF booking flow
- **Problem**: When a welper accepts an already-ACCEPTED booking, the BFF returns `toResponse(booking)` without `attachPaymentAndReceipt` — so the response has no `paymentPhase`. A client refreshing after a network blip sees a "no payment phase" booking briefly until the next refetch.
- **Proposed solution**: in the idempotent branch, also call `attachPaymentAndReceipt` so the response shape is identical to the non-idempotent path.
- **Acceptance criteria**:
  - Re-accepting an accepted booking returns the same shape as the first accept.
  - Tests cover the idempotent branch.
- **Effort**: XS.
- **Files**: `apps/bff/src/domains/booking/booking.service.ts:493`.

---

## Suggested execution bundles

These are loosely-coupled bundles you can ship in successive PRs without inter-dependencies blocking each other. Within a bundle, tickets are listed in the order they should land.

### Bundle A — Booking trust + transparency (1 sprint)

The customer-trust bundle. Ships the policy + UX so customers can confidently book. Closes the loop between Wave 1 (welper trust signals) and Wave 3 (payment-capture timing).

- BOOKING-006 — Cancellation-fee policy: design + ship (P2)
- BOOKING-010 — Welper response-time SLA visible in the wizard (P2)
- BOOKING-017 — Welper service-area accuracy: distance display (P3)

### Bundle B — Booking velocity (1 sprint)

The "remove friction from the act of booking" bundle. Pure conversion levers.

- BOOKING-007 — Form persistence (S)
- BOOKING-009 — "Book again" from past bookings (S)
- BOOKING-011 — Recent searches (S)

### Bundle C — Race-safety + lifecycle hardening (1.5 sprints)

The "make booking concurrent-safe + state-honest" bundle. The single highest-leverage tech-quality work after Day 11.

- BOOKING-001 — Slot reservation (M)
- BOOKING-003 — Live status updates (M)
- BOOKING-004 — Pending TTL (M)
- BOOKING-018 — accept idempotency shape (XS)

### Bundle D — Reschedule + recurring (2 sprints)

The "service-marketplace product completeness" bundle. Without these, welpco competes one-shot-bookings only — and the home/childcare market is recurring-first.

- BOOKING-002 — Reschedule flow (L)
- BOOKING-008 — Recurring bookings (L)
- BOOKING-015 — Welper receipt evidence upload (M)

### Bundle E — Search relevance + e2e coverage (1 sprint)

The "search becomes good + tests catch regressions" bundle.

- BOOKING-005 — Honest relevance sort (M)
- BOOKING-014 — E2E coverage (M)
- BOOKING-016 — Schedule visualization in wizard (L) — optional / can split

### Bundle F — Tips + welper engagement (post-launch)

- BOOKING-012 — Tip flow (L)
- BOOKING-013 — Welper engagement signals (M)
