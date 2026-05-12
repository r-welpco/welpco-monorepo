# Reviews — open tickets

Source: Day 12 messages + reviews functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 3 P1/P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Messages surface: `features/messages_features.md` — REVIEWS-007 (moderation queue) and MESSAGES-006 (block / report) share an admin queue; design once.
- Booking surface: `features/booking_features.md` — review entry-points live on the booking-detail page; the booking lifecycle gates which reviews are eligible.
- Bible §22.6: a welper's public score is built only from CUSTOMER → WELPER reviews. Welper-on-customer reviews exist (entity supports it) but must NEVER feed the public score. This audit verified the producer side respects that contract.

---

## Shipped in the Day 12 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day12-R-01 | P1 | Welper public profile page (`/welper/[id]`) | The page rendered a rating headline ("4.50 · 12 reviews") with no way to actually read those reviews. Bible §22.6 honesty gap: a score without the substance behind it is half a trust signal — it tells the customer "trust this welper" without showing why. Wired `useWelperReviews` + `<ReviewList>` directly under the services section. Filtered to `reviewerType === "customer"` so welper-on-customer reviews can never leak into the welper's public surface (matches the BFF aggregator's filter). Marked every card `verified={true}` because the BFF already enforces "review must come from the booking customer". |
| Day12-R-02 | P1 | BFF `ReviewService.refreshWelperAggregateForReviewee` | The denormalized counter on `welper_profiles.rating` / `review_count` was rebuilt without the `reviewer_type = customer` filter. It worked today (revieweeId-based filter happens to exclude welper-on-customer reviews because their reviewee is the customer, who has no welper profile row), but it was contract-fragile — any future migration that stored a welper-on-welper or admin test row could silently inflate the score. Now mirrors `WelperProfileAggregatesService` (the on-demand aggregator) with explicit `andWhere('r.reviewer_type = :reviewerType')`. Locked down by a new spec (`review.service.spec.ts`). |
| Day12-R-03 | P2 | `RatingForm` (platform) | (a) Star rating widget had no `role="radiogroup"` and no arrow-key navigation — failed WCAG 2.1 AA radiogroup pattern. Now: container is `role="radiogroup"` with an `aria-labelledby` to the "Rating" label; each star is a `role="radio"` with `aria-checked`; roving tabindex; arrow keys (Left/Right/Up/Down) move focus and selection; Home/End jump to 1/5; Space/Enter selects. (b) Comment field had a 2000-char schema cap but no `maxLength` attribute and no counter — silent server-side errors on long comments. Now a 90% threshold counter with `aria-live="polite"` + a hard `maxLength={2000}` attribute. |

---

## REVIEWS-001 — Reviewer display name (real identity, not "Customer #ABC123")

- **Priority**: P1 (trust + product completeness)
- **Area**: BFF `getReviewsForWelper` + customer-profile + web welper profile
- **Problem**: After Day12-R-01, the welper public profile shows reviews — but the reviewer is rendered as `Customer #A12B34` (a slice of their user id). That's a privacy-safe placeholder that doesn't help the next customer evaluate the trust signal. Real-name reviews are how every reputable marketplace builds social proof. Today the customer-profile entity has `firstName` / `lastName` but the BFF `getReviewsForWelper` doesn't join + project them, and the FE has no consented "show my name on reviews I write" preference.
- **Proposed solution**: extend `ReviewResponseDto` with `reviewerDisplayName: string` (computed: first name + last initial — "Maria L." — by default; opt-out switch in customer settings to render as "Customer #…" if they want privacy). BFF joins `customer_profiles` on `reviewerType = customer`. Web swaps the `reviewerName` mapping to use the new field.
- **Acceptance criteria**:
  - Public profile shows "Maria L. — 5 stars" with the correct customer-profile join.
  - Settings toggle for "Display my name on my reviews" (default ON).
  - Tests cover the two display modes + the join + the welper→customer reviews remaining anonymized (welper-as-reviewer reviews never appear on the welper's public page anyway, but if/when a customer profile shows reviews about them, the welper's name is treated symmetrically).
- **Effort**: M.
- **Files**: `apps/bff/src/domains/review/dto/review-response.dto.ts`, `review.service.ts` (add join), `customer-profile.entity.ts` (add `displayReviewerNamePublicly: boolean`), web welper profile reviewer mapper, settings page toggle.

---

## REVIEWS-002 — Welper public response to reviews

- **Priority**: P1
- **Area**: BFF + welper profile (reviews) + welper dashboard
- **Problem**: Today reviews are one-way. A welper who got a 1-star review for a misunderstanding ("the customer thought I was bringing supplies; my listing is clear that I don't") has no way to respond publicly. Every mature marketplace gives the reviewee a one-time public reply. Without it, an unfair review sits permanently undefended.
- **Proposed solution**: extend `Review` with `response_text TEXT NULL`, `response_at TIMESTAMP NULL`. Endpoint `POST /api/bookings/:bookingId/review/response` (only the reviewee can hit it; once written, can be edited within 7 days, immutable after). Render under the comment in `<ReviewCard>` as "Response from {welperName} — Apr 15, 2026 — …". Cap at 1000 chars.
- **Acceptance criteria**:
  - Welper sees a "Reply to this review" CTA next to their reviews on the dashboard.
  - Response renders publicly under the customer's review.
  - 7-day edit window.
  - Tests cover write + edit + ACL.
- **Effort**: M.
- **Files**: BFF `review.entity.ts` (migration), `review.service.ts`, `review.controller.ts`, `review-card.tsx` (response section), web welper-side review-management page (currently doesn't exist — file as part of this ticket).

---

## REVIEWS-003 — Photo attachments on reviews

- **Priority**: P2
- **Area**: BFF + `RatingForm` + `ReviewCard`
- **Problem**: A customer who got an exceptional clean of their kitchen has nothing to share but text. Photo evidence is a major trust signal for service marketplaces ("see what they did"). Same infra as MESSAGES-004 / Wave 2 evidence files.
- **Proposed solution**: extend `Review` with `photo_urls TEXT[]` (max 4 photos, ≤10MB each, image mime-types only). Same signed-URL upload flow as dispute evidence. `RatingForm` grows a photo-uploader; `ReviewCard` renders a thumbnail grid that opens a lightbox.
- **Acceptance criteria**:
  - Customer can upload up to 4 photos in the review form.
  - Welper public profile shows them in the review card.
  - Tests cover upload + ACL + delete-on-review-edit.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/review/entities/review.entity.ts` (migration), `review.service.ts`, `dto/create-review.dto.ts`, `rating-form.tsx`, `review-card.tsx`.

---

## REVIEWS-004 — Edit / delete window for reviews

- **Priority**: P2
- **Area**: BFF + booking detail
- **Problem**: Today: reviews are immutable after submission (`update` exists but the booking-detail UI doesn't wire it after the first save except via the edit dialog). There's no delete. There's no time bound. So a customer who wrote an angry 1-star review the night of a bad booking, then made up with the welper a week later, has no recourse — the bad review sits forever.
- **Proposed solution**: explicit policy: reviews are editable for **14 days** after submission; deletable for **7 days**. After that, both are locked (mature marketplaces freeze reviews to prevent retroactive reputation manipulation). UI shows the lock state honestly: "You can edit this until Apr 28."
- **Acceptance criteria**:
  - BFF rejects update past 14 days with a 403 + clear error.
  - BFF supports DELETE inside the 7-day window; rejects after.
  - UI shows the remaining time + disables the Edit button when locked.
  - Tests cover the boundary (13.99 days editable; 14.01 days locked).
- **Effort**: S.
- **Files**: `apps/bff/src/domains/review/review.service.ts` (window check), `review.controller.ts` (DELETE endpoint), web booking-detail review block.

---

## REVIEWS-005 — Review prompt (email + in-app) at +24h after completion

- **Priority**: P1 (review-volume = trust-volume; today most bookings get no review at all)
- **Area**: BFF (scheduler + email) + web (in-app prompt)
- **Problem**: Today a customer can leave a review only if they remember to navigate to the booking detail. The CTA is buried below the receipt. Most bookings end with no review — which means the welper's score is built from a small biased sample (mostly extreme experiences). A nudge at the right moment dramatically lifts review volume; bible §22.6 honesty contract = the rating is only as honest as the sample size.
- **Proposed solution**: scheduled job (BullMQ) — at +24h after `COMPLETED`, send the customer an email + an in-app notification: "How was your time with {welperName}? Leave a review →". Soft re-prompt at +7d if still un-reviewed. Stop after the 7d nudge (no spam). Respect `notification-preferences` opt-out.
- **Acceptance criteria**:
  - +24h prompt fires; deep link lands on the review form pre-opened on the booking detail.
  - +7d soft re-prompt fires once.
  - Customer who already reviewed never gets either prompt.
  - Settings opt-out works.
  - Tests cover the scheduling boundaries.
- **Effort**: M.
- **Files**: new `apps/bff/src/domains/review/review-prompt.scheduler.ts`, `email.service.ts` template, `notification.service.ts`, web in-app notification handler (already exists; just add the new type).

---

## REVIEWS-006 — Welper's view of the customer (reciprocal review surface)

- **Priority**: P2
- **Area**: BFF + booking detail (already partially wired) + welper dashboard
- **Problem**: The entity supports `reviewerType = welper` (a welper reviewing a customer). The UI has a "Review customer" button on the booking detail. But there's no surface where these reviews are read — they're effectively write-only data. Bible §22.6: welper-on-customer reviews don't feed the customer's public score (we don't expose customer ratings), but they DO need to feed the welper's pre-booking decision ("has any other welper flagged this customer as difficult?"). Without that, repeat bad customers flow uninhibited from welper to welper.
- **Proposed solution**: when a welper opens a PENDING booking request, surface a "Customer history" sidebar with: # past completed bookings on Welpco, average welper-given rating (private — not public), most recent welper review snippet. This is a closed, welper-only signal. Bible §22.6 trust contract: this surface is intentionally welper-private — never public.
- **Acceptance criteria**:
  - Welper sees customer-history block on PENDING booking detail.
  - Customer never sees this block (ACL enforced).
  - Aggregator filters by `reviewer_type = welper` (the mirror of the existing customer-aggregator).
  - Tests cover the ACL.
- **Effort**: M.
- **Files**: new `apps/bff/src/domains/profile-management/customer-profile/customer-profile-aggregates.service.ts`, new endpoint `GET /api/customers/:id/welper-history` (welper-only), web welper booking-detail sidebar.

---

## REVIEWS-007 — Report a review (moderation queue; T&S)

- **Priority**: P1
- **Area**: BFF + welper profile + admin app
- **Problem**: A welper who gets a clearly-fake review (competitor sabotage; mistaken-identity; off-topic personal attack) has no way to flag it for review. Today it sits permanently. Bible §22.6: trust requires recourse. Pair with MESSAGES-006 (same admin moderation queue infrastructure).
- **Proposed solution**: "Report this review" button on each review card (visible to the reviewee + to logged-in users; not anon-public). Modal with categories (fake, off-topic, abusive, conflict-of-interest, other) + free-text. Creates a `review_reports` row → moderator queue in admin. Reported reviews keep displaying but with a small "Reported — under review" annotation visible only to the reviewee until resolved.
- **Acceptance criteria**:
  - Welper can report a review on themselves.
  - Reported review shows the moderator-only annotation to the welper, no change for public viewers (avoids the Streisand effect).
  - Admin queue (separate ticket) consumes the queue.
  - Tests cover the producer side + ACL.
- **Effort**: M (producer side; admin consumer is a separate ticket).
- **Files**: new `review-report.entity.ts` (migration), `review-report.service.ts`, `review.controller.ts` (report endpoint), `review-card.tsx` (overflow menu).

---

## REVIEWS-008 — Sort + filter on the welper public profile

- **Priority**: P3
- **Area**: Web welper profile + BFF
- **Problem**: Today reviews load in `createdAt DESC` order with no filter. A power-curious customer wants to see "lowest rated first" (red-flag scan) or "with photos" (when REVIEWS-003 lands). Bible §17.3: useful filters.
- **Proposed solution**: sort dropdown (Newest / Highest / Lowest); filter chips (With photos / 5-star only / 1–2-star). Server-side pagination (already present); the BFF accepts `sort` + `minRating` / `maxRating` / `hasPhotos` query params.
- **Acceptance criteria**:
  - All sort + filter combinations return correct counts.
  - URL is shareable (state in query string).
- **Effort**: S.
- **Files**: BFF `review.controller.ts` + `review.service.ts`, web welper profile reviews block.

---

## REVIEWS-009 — Honest "X reviews" pluralization + cold-start copy

- **Priority**: P3
- **Area**: Welper profile hero + welper-card
- **Problem**: Wave 1 already ships "No reviews yet" for zero-review welpers. But the threshold-of-trust is more like 5 reviews — a welper with 1 review has a noisy signal. Today we render "5.00 · 1 review" which over-claims confidence. Marketplaces typically dampen low-volume signals: "1 review · new welper", "5 stars · 1 review (ratings are early)".
- **Proposed solution**: when `reviewCount < 5`, render the rating with a soft caveat ("ratings are early") below the headline. When `reviewCount === 0`, today's "No reviews yet" stays. When `reviewCount >= 5`, no caveat. Mirrors the `WelperProfileAggregatesService.responseTimeMinutes` 5-booking floor (Wave 1 already chose 5 as the credibility threshold elsewhere).
- **Acceptance criteria**:
  - 0 reviews → "No reviews yet"
  - 1–4 reviews → rating shown with "Ratings are early — based on {n} review{s}"
  - 5+ reviews → rating shown without caveat
- **Effort**: XS.
- **Files**: `apps/web/app/welper/[id]/page.tsx` (RatingLine), `packages/ui/src/platform/service-discovery/welper-profile-card{,-compact}.tsx`.

---

## REVIEWS-010 — Anti-fake-review hardening

- **Priority**: P2 (T&S; before the marketplace gets large enough to attract fraud)
- **Area**: BFF
- **Problem**: Today's only anti-fake-review defence is "must be a participant of a COMPLETED booking + max one review per booking". That's good baseline but vulnerable to: (a) friends-and-family bookings (welper books their cousin to write 5-star reviews), (b) an adversarial customer creating a second account to leave a second review for the same booking via the second account (current ACL would catch this, since the second account isn't a participant — but worth a spec to lock).
- **Proposed solution**: heuristic flagging at write-time: same-IP-address booking + review (log + flag); review submitted within 5 minutes of booking COMPLETED (suspicious — flag); booking total < $10 (suspiciously cheap booking; flag). Flagged reviews still count but are surfaced to a moderator dashboard. Don't auto-suppress (avoid suppression mistakes); rely on human review.
- **Acceptance criteria**:
  - Heuristic flags written to a `review_flags` audit table.
  - Tests cover each heuristic branch.
  - Flags do NOT block the review from displaying (avoid false-positive reputation damage).
- **Effort**: M.
- **Files**: new `apps/bff/src/domains/review/review-flag.entity.ts`, `review-fraud.service.ts`, hook into `review.service.create`.

---

## REVIEWS-011 — "Verified booking" badge currently hardcoded; tighten the contract

- **Priority**: P3
- **Area**: BFF + welper profile reviews block
- **Problem**: Day12-R-01 hardcoded `verified={true}` on every review card on the welper public profile. That's accurate today (the BFF won't accept a review except from the booking customer), but the contract isn't explicit in the DTO — a future endpoint that imports legacy reviews from another system might break the invariant.
- **Proposed solution**: extend `ReviewResponseDto` with `verifiedBooking: boolean` (always `true` from the current write path; explicitly modeled so external imports can be flagged `false`).
- **Acceptance criteria**:
  - DTO carries the field.
  - Web reads from the DTO instead of hardcoding.
  - Tests cover the default (always true today).
- **Effort**: XS.
- **Files**: `apps/bff/src/domains/review/dto/review-response.dto.ts`, `review.service.ts` (toDto), web welper profile.

---

## Suggested execution bundles

These are loosely-coupled bundles you can ship in successive PRs without inter-dependencies blocking each other. Within a bundle, tickets are listed in the order they should land.

### Bundle A — Trust-signal completeness (1 sprint)

The "make the rating signal honest end-to-end" bundle. After this bundle, the welper public profile's rating block tells the truth — score + sample + the actual reviews + reviewer identity + sample-size honesty.

- REVIEWS-001 — Reviewer display name (M)
- REVIEWS-009 — Cold-start copy (XS)
- REVIEWS-011 — VerifiedBooking DTO field (XS)

### Bundle B — Volume + freshness (1 sprint)

The "more reviews, sooner" bundle. Drives review volume up so the score becomes statistically meaningful for more welpers.

- REVIEWS-005 — +24h prompt (M, foundational)
- REVIEWS-004 — Edit / delete window (S)

### Bundle C — Photo + voice (1.5 sprints)

The "richer reviews" bundle. Photos drive trust most; welper response gives reviewees recourse.

- REVIEWS-003 — Photo attachments (M)
- REVIEWS-002 — Welper response (M)

### Bundle D — Trust + safety (1 sprint; pair with MESSAGES Bundle B)

The "marketplace integrity" bundle. Same admin moderation queue serves messages + reviews. Don't ship one without the other.

- REVIEWS-007 — Report a review (M)
- REVIEWS-010 — Anti-fake-review heuristics (M)

### Bundle E — Reciprocal + power-user (post-Bundle-A)

- REVIEWS-006 — Welper's customer-history sidebar (M)
- REVIEWS-008 — Sort + filter on the public profile (S)
