# Disputes — open tickets

Source: Day 13 disputes + notifications functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 4 P1/P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Notifications: `features/notifications_features.md` — `NOTIFICATIONS-001` adds dispute-event firing (no dispute event today fires a notification, so a participant who steps away from the page misses the resolution entirely).
- Booking surface: `features/booking_features.md` — the "Report a problem" entry-point lives on the booking detail; capture-timing + refund honesty (Wave 3) feeds the resolution outcome users see in `DISPUTES-005`.
- Messages: `features/messages_features.md` — every dispute begins as a "this isn't going right" thread; `MESSAGES-006` (block / report) feeds the dispute pipeline.

---

## Shipped in the Day 13 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day13-D-01 | P2 | `ResolutionCard` (platform) | Was using raw `green | red | amber` colors for status — Day 2 decision 6 violation. Now flows through `SEMANTIC_COLOR` (`success | danger | warning`), badge gets `highContrast`. Component is currently unused in the app (see DISPUTES-005) but the contract is now correct for when it's wired up. |
| Day13-D-02 | P2 | `DisputeForm` (platform) | Subject + description had no `maxLength` — BFF caps subject 255 / description 5000, FE silently allowed up to whatever the textarea would hold and surfaced a generic 400 on submit. Now exports `DISPUTE_SUBJECT_MAX_LENGTH` / `DISPUTE_DESCRIPTION_MAX_LENGTH`, mirrors the schema bound, sets `maxLength` on both fields. Also dropped the leading example "Welper didn't show up" — biased the reporter toward one specific category. |

---

## ~~DISPUTES-001 — Evidence upload is unwired in the production "Report a problem" flow~~ [SHIPPED]

**Shipped 2026-05-06** — Day 16. See `apps/web/AUDIT-LOG.md` Day 16 entry. The BFF gained `POST /api/disputes/evidence/presign` (15-min PUT URLs, content-type whitelist, 10 MB cap, per-user namespace `disputes/<userId>/<uuid>.<ext>`). `EvidenceUpload` (platform) was rewritten to drive the full upload lifecycle when given an `uploadFile` callback; `DisputeForm` mounts it inline and ships the resulting keys with the dispute create payload. Customer can now attach up to 5 files (jpg/png/webp/heic/pdf) per report. Empty evidence remains valid.

- **Priority**: P0 (trust + safety)
- **Area**: Web booking-detail dispute dialog + `DisputeForm` (platform)
- **Problem**: The BFF `CreateDisputeDto` accepts an `evidence` array; the `EvidenceUpload` platform component exists with file picker + size/type/count guards; but the booking-detail dialog (`apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx:1685`) renders `<DisputeForm>` standalone with no evidence picker. `createDisputeMutation.mutateAsync` sends `{subject, category, description}` only — never `evidence`. Bible §22.6: the trust contract says "we read every report" — without evidence, the report is hearsay against hearsay, which makes resolution slower AND less fair.
- **Proposed solution**: extend `DisputeFormProps` with `evidence` value + `onEvidenceChange` (or compose `EvidenceUpload` inside the form). The booking-detail caller wires file uploads through the existing Wave 2 signed-URL upload service (same one used by profile photos and welper docs). On submit, send `evidence: [{type: 'file', key: <s3key>}, ...]` to the BFF.
- **Acceptance criteria**:
  - Customer can attach up to 5 photos / PDFs (10MB each) to a new dispute.
  - Files upload to S3 via signed URL; the dispute payload references the keys.
  - Dispute detail renders the evidence with a working "Download" link backed by the BFF's per-request 15-min `signedUrl`.
  - File-size / file-type rejection surfaces inline (not on submit).
  - Tests cover: upload happy path, file-too-big, count-over-limit, dispute create includes the keys.
- **Effort**: M (signed-URL upload + DisputeForm integration + detail page rendering).
- **Files**: `packages/ui/src/platform/dispute-resolution/dispute-form.tsx`, `packages/ui/src/platform/dispute-resolution/evidence-upload.tsx`, `apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx`, `apps/web/app/(dashboard)/dashboard/disputes/[id]/page-client.tsx`, `apps/web/lib/services/dispute-service.ts` (already has the type), new `apps/web/lib/services/evidence-upload-service.ts`.

---

## ~~DISPUTES-002 — Category enum mismatch loses information ("safety" reports impossible)~~ [SHIPPED]

**Shipped 2026-05-06** — Day 16. See `apps/web/AUDIT-LOG.md` Day 16 entry. The canonical `DisputeCategory` enum (`no_show | quality | overcharge | safety | other`) lives in `@welpco/types` (`packages/types/src/domain/dispute-category.type.ts`). `DisputeForm` consumes it 1:1 with no lossy mapping; the booking-detail page-client's `categoryMap` was deleted. Selecting `safety` renders a Bible §22.6 honesty callout: "If you're in immediate danger, call 911 first. We respond to safety reports within 4 hours and may contact you directly." `<SelectTrigger>` carries `aria-required="true"` per Bible §16.3.

- **Priority**: P0 (trust + safety)
- **Area**: `DisputeForm` schema vs BFF dto
- **Problem**: `DisputeForm` uses `type: 'payment' | 'service' | 'booking' | 'other'` (`packages/ui/src/platform/dispute-resolution/dispute-form.tsx:40`). BFF accepts `category: 'no_show' | 'quality' | 'overcharge' | 'safety' | 'other'`. The booking-detail caller maps `payment → overcharge`, `service → quality`, `booking → no_show`, `other → other` (`apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx:1694-1699`). Two bugs:
  1. **Safety reports can never be filed** — there is no FE input that maps to BFF `safety`. Safety is the most important category in a marketplace where strangers enter homes. Bible §22.6 contract violation, T&S baseline failure.
  2. **`booking → no_show` is a lossy guess** — a user complaining the booking was scheduled wrong, not that the welper was absent, gets miscategorized.
- **Proposed solution**: align FE and BFF enums end-to-end. `DisputeForm` accepts `category: DisputeCategory` directly with Select options "Welper didn't show up / Service quality / Pricing / Safety / Other". Drop the `type → category` map. Add a separate "Safety" copy block that gates on the value (bible §22 voice — for safety, the reporter should know we treat it differently and may contact them).
- **Acceptance criteria**:
  - Customer + welper can file `safety` disputes from the booking detail.
  - Form options match BFF enum 1:1.
  - Picking `safety` shows an inline note: "If you're in immediate danger, call 911 first. We respond to safety reports within 4 hours."
  - Tests: each category round-trips create → list → detail with the same value.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/dispute-resolution/dispute-form.tsx`, `apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx`.

---

## DISPUTES-003 — Booking-detail dispute dialog has no description optional path

- **Priority**: P1
- **Area**: `DisputeForm`
- **Problem**: BFF `CreateDisputeDto.description` is `@IsOptional()`. FE schema requires `min(20)` chars. A user with a clear subject ("welper didn't arrive") and no further context is forced to type 20 characters of filler — bible §22.6 honesty: don't make people lie to your validators.
- **Proposed solution**: relax the schema — `description: z.string().max(5000).optional()`. Keep the helper text ("The more specific, the faster we can help") to nudge richer reporting without blocking minimal ones.
- **Acceptance criteria**:
  - User can submit with subject only (no description).
  - User can submit with subject + description up to 5000 chars.
  - Tests: empty description + no description both round-trip cleanly.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/dispute-resolution/dispute-form.tsx`.

---

## DISPUTES-004 — Dispute detail never renders the actual evidence (count only)

- **Priority**: P1 (paired with DISPUTES-001)
- **Area**: Web dispute detail
- **Problem**: `apps/web/app/(dashboard)/dashboard/disputes/[id]/page-client.tsx:186-199` — when the dispute has evidence, the page renders only a count (`"3 items attached."`). The BFF returns each item with a 15-min `signedUrl` (`DisputeItem.evidence[].signedUrl`); the FE never references it. Bible §22.6: the report is shown but the evidence behind it is not — same trust gap as Day 12's "rating with no reviews behind it."
- **Proposed solution**: render each evidence item as a card with filename, file-type icon, "Download" button (anchored to `signedUrl`). When `signedUrl` is null (S3 not configured / signing failed), render a disabled "Download not available — refresh the page" affordance with a helpful hint.
- **Acceptance criteria**:
  - Each `file`-typed evidence row renders with download CTA.
  - `message`-typed evidence rows render with the message snippet (post-DISPUTES-009).
  - Null `signedUrl` shows an honest fallback, not a broken link.
  - SR-friendly download action.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/disputes/[id]/page-client.tsx`.

---

## DISPUTES-005 — Resolution outcome invisible to participants ("resolved" with no detail)

- **Priority**: P1 (money honesty)
- **Area**: BFF + web dispute detail
- **Problem**: When admin resolves a dispute (`POST /api/disputes/:id/resolution` — refund / partial refund / warning / no action / closed), the BFF stores the resolution row with type, refund amount, notes. The participant fetch (`GET /api/disputes/:id`) does NOT include resolution detail (only admin fetches do — `dispute.service.ts:327-342`). So a customer who got a refund sees status "resolved" with zero context: was it a full refund? Partial? How much? Bible §22.6: tell users what you did with their money. The platform `ResolutionCard` exists for this exact purpose and is currently unused.
- **Proposed solution**: include `resolution` (resolutionType, refundAmount, resolvedAt, notes-redacted-for-participants) on the participant `GET /api/disputes/:id` response when `dispute.status === 'resolved'`. Web dispute detail mounts `ResolutionCard` below the hero. Strip admin-only fields (resolvedById, internal notes) — show only the user-facing summary.
- **Acceptance criteria**:
  - Customer sees "Refund of $X.XX issued on YYYY-MM-DD" for refund / partial_refund.
  - Customer sees "Resolved with a warning to the welper" / "Closed without action" for warning / no_action / closed.
  - Welper sees the same summary (their stake is also money + reputation).
  - Internal admin notes never leak to participants.
  - Tests: resolution-type matrix × participant-visible fields.
- **Effort**: M (BFF DTO additions + web wire-up + `ResolutionCard` integration).
- **Files**: `apps/bff/src/domains/dispute/dto/dispute-response.dto.ts`, `apps/bff/src/domains/dispute/dispute.service.ts`, `apps/web/lib/services/dispute-service.ts`, `apps/web/app/(dashboard)/dashboard/disputes/[id]/page-client.tsx`, `packages/ui/src/platform/dispute-resolution/resolution-card.tsx` (already aligned to SEMANTIC_COLOR in Day 13).

---

## DISPUTES-006 — No statute of limitations on dispute filing

- **Priority**: P1 (money + abuse)
- **Area**: BFF dispute service
- **Problem**: `disputableStatuses = ["in_progress", "completed", "payment_released", "no_show"]` has no time bound (`apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx:306`). A customer can file a dispute on a 2-year-old booking. The welper has long since spent the money; the platform has no realistic path to a fair resolution. Day 11 booking audit established "free cancellation any time before service starts" — the inverse honesty contract is missing here: when does the dispute window close?
- **Proposed solution**: add `disputeWindowDays` (e.g. 7) to BFF `dispute.service.create`. Reject creation when `now - booking.completedAt > windowDays`. Surface the deadline on the booking detail action row: "Report a problem (closes 6d 4h from now)". After the window, hide the entry point and show "Outside the report window — contact support if needed."
- **Acceptance criteria**:
  - In-window: customer can file dispute as today.
  - Out-of-window: BFF returns 400 with explicit message; FE renders an explainer + "contact support" link.
  - Booking detail surfaces the countdown for the last 48h.
  - Configurable via env / `DisputePolicyConfig`.
  - Tests: window-edge cases (just-in / just-out).
- **Effort**: M.
- **Files**: `apps/bff/src/domains/dispute/dispute.service.ts`, `apps/bff/src/config/dispute.config.ts` (new), `apps/web/app/(dashboard)/dashboard/bookings/[id]/page-client.tsx`.

---

## DISPUTES-007 — Welper has no response surface (one-sided dispute)

- **Priority**: P1 (fairness; mirrors REVIEWS-002)
- **Area**: BFF + web dispute detail
- **Problem**: When a customer files a dispute, the welper sees the report (`findById` with their own user as the participant) but cannot respond. The welper's only communication channel is the booking message thread, which the admin reading the dispute may or may not check. Bible §22.6 fairness contract — both sides should get to tell their version before a financial outcome.
- **Proposed solution**: new `DisputeComment` entity (`disputeId`, `authorId`, `authorRole`, `body`, `createdAt`). Endpoints `GET /api/disputes/:id/comments` + `POST /api/disputes/:id/comments`. Both participants + admins can post; comments are visible to both sides + admin. Render in the dispute detail below the hero card as a chronological thread (mirrors `MessageThread` rendering — reuse the platform component).
- **Acceptance criteria**:
  - Welper can post a response visible to customer + admin.
  - Customer can post follow-up.
  - SR-friendly thread view.
  - Comments are immutable post-resolution.
  - Tests: participant ACL, post-resolution lockdown, both-roles round-trip.
- **Effort**: M.
- **Files**: new `apps/bff/src/domains/dispute/entities/dispute-comment.entity.ts`, `dispute.service.ts`, `dispute.controller.ts`, web detail + new `useDisputeComments` hook.

---

## DISPUTES-008 — `relatedBookingId` field useless in the booking-context dialog

- **Priority**: P3 (copy + IA)
- **Area**: `DisputeForm`
- **Problem**: `DisputeForm` accepts a `relatedBookingId` text field. In the booking-detail dialog, `defaultValues={{ relatedBookingId: bookingId }}` prefills it — but the field is still rendered, asking the user to confirm a UUID they don't know exists. Caller never reads the value (the booking ID is in the URL and passed separately to `createDispute`). Cognitive friction with no functional benefit.
- **Proposed solution**: hide the field when `defaultValues.relatedBookingId` is set + non-empty. For the standalone use (support-ticket-style dispute creation, if it lands), keep the field. Cleanest: gate the field on a `showBookingIdField` prop.
- **Acceptance criteria**:
  - Booking-context dialog: no booking-ID field.
  - Standalone dispute form (if used): field is shown.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/dispute-resolution/dispute-form.tsx`.

---

## DISPUTES-009 — Message-typed evidence is opaque

- **Priority**: P2
- **Area**: BFF + web dispute detail
- **Problem**: Evidence array supports `type: 'message'` with an `id` (presumably a chat message ID). FE rendering ignores `message`-typed entries entirely. If the user attached "see this message thread" as evidence, the dispute detail shows nothing useful.
- **Proposed solution**: when evidence row is `message`-typed, hydrate via `GET /api/messages/:id` (or include the snippet in the dispute response). Render as a quote bubble with sender + timestamp + body. Link to the full thread.
- **Acceptance criteria**:
  - Message evidence renders with sender / time / body.
  - Bad / deleted message ID falls back gracefully ("Message no longer available").
  - Tests: hydration happy path + missing-message fallback.
- **Effort**: S.
- **Files**: `apps/bff/src/domains/dispute/dispute.service.ts` (resolve message snippets), web dispute detail.

---

## DISPUTES-010 — Dispute list lacks status filter / tabs

- **Priority**: P2
- **Area**: Web disputes list
- **Problem**: `apps/web/app/(dashboard)/dashboard/disputes/page-client.tsx` renders a flat paginated list. No tabs / filter for `open` vs `resolved` vs `withdrawn` etc. Day 11 booking audit fixed the same gap on bookings; this surface should match.
- **Proposed solution**: add `<TabNav>` with All / Active / Resolved / Withdrawn filters. Active = open + in-review + escalated. BFF list endpoint already has admin-only status filter — extend to participants (filter by status, not actor type).
- **Acceptance criteria**:
  - Tab counts reflect total disputes per filter.
  - Filter persists via query param.
  - Pagination resets on tab change.
  - Tests: each tab fetches the right slice.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/disputes/page-client.tsx`, `apps/bff/src/domains/dispute/dispute.controller.ts`.

---

## DISPUTES-011 — No e2e spec for the dispute lifecycle

- **Priority**: P2
- **Area**: Web e2e
- **Problem**: Mirrors Day 11's BOOKING-014 / Day 12's MESSAGES gap. No Playwright or equivalent covering the file → list → detail → withdraw arc. Every refactor risks silent regression on a money-flow-adjacent surface.
- **Proposed solution**: e2e spec under `apps/web/e2e/disputes/disputes.spec.ts` covering: customer files dispute → appears in list → detail renders → filer withdraws → status flips → booking restored to completed.
- **Acceptance criteria**:
  - Spec runs in CI.
  - Covers the happy path + 1 negative (non-filer cannot withdraw).
- **Effort**: M.
- **Files**: new `apps/web/e2e/disputes/disputes.spec.ts`.

---

## DISPUTES-012 — Withdraw button missing on disputes list (only on detail)

- **Priority**: P3
- **Area**: Web disputes list
- **Problem**: From the list, the only path to withdraw is `View report → Withdraw report`. For users with multiple in-flight reports who realize one's no longer needed, the extra navigation is unnecessary friction. Bible §17.2 latency reassurance + §17.5: keep the action close to the affordance.
- **Proposed solution**: add a `…` menu on each list row with "Open booking" + "Withdraw" (when `canWithdraw`). Same `ActionConfirmDialog` primitive.
- **Acceptance criteria**:
  - Per-row menu when filer + status withdrawable.
  - Confirmation dialog identical to detail page.
  - List refreshes optimistically.
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/disputes/page-client.tsx`.

---

## DISPUTES-013 — Dispute detail "What happens next" is static — never reflects the real status

- **Priority**: P3
- **Area**: Web dispute detail
- **Problem**: The "What happens next" card always reads "Our team reviews every report within 48 hours." For `in-review` disputes, that's accurate. For `resolved`, `withdrawn`, `escalated`, it's wrong. Bible §22.6 honesty.
- **Proposed solution**: compute `nextStepCopy` from `dispute.status`. Examples:
  - `open`: "Our team reviews every report within 48 hours."
  - `in-review`: "We're looking into this. Expect an update within 24 hours."
  - `resolved`: "Resolved on YYYY-MM-DD. See the resolution above." (post-DISPUTES-005)
  - `withdrawn`: "You withdrew this report. File a new one if something else comes up."
  - `escalated`: "Escalated to senior support. We'll be in touch shortly."
- **Acceptance criteria**:
  - Each status shows status-appropriate copy.
  - Copy reviewed by `design:ux-copy` skill before merge.
- **Effort**: XS.
- **Files**: `apps/web/app/(dashboard)/dashboard/disputes/[id]/page-client.tsx`.

---

## DISPUTES-014 — `DisputeForm` submit button uses `primary` (green) for a serious action

- **Priority**: P3
- **Area**: `DisputeForm`
- **Problem**: The "Send report" button uses `SEMANTIC_COLOR.primary` (green = success / CTA). A dispute is a problem report, not a happy moment. Bible §22 voice — visual color signals affect tone. `warning` (amber) is more honest. Day 11 booking audit used `warning` for the booking-detail Report a problem button for this exact reason.
- **Proposed solution**: switch the submit color to `SEMANTIC_COLOR.warning`.
- **Acceptance criteria**:
  - Submit button is amber, matches the entry-point button on the booking detail.
  - No regression in disabled / loading state.
- **Effort**: XS.
- **Files**: `packages/ui/src/platform/dispute-resolution/dispute-form.tsx`.

---

## DISPUTES-015 — `support-ticket-card` reuses `DisputeStatusBadge` but DB statuses don't match

- **Priority**: P3
- **Area**: `SupportTicketCard` (platform)
- **Problem**: `SupportTicketCard.props.status: DisputeStatus` reuses dispute statuses. Support tickets have their own lifecycle (`open`, `assigned`, `awaiting_customer`, `closed`). Forcing them through `DisputeStatusBadge` means most ticket states render unknown / fall through to `closed`.
- **Proposed solution**: introduce `SupportTicketStatusBadge` with its own status map. Update `SupportTicketCard` to use it.
- **Acceptance criteria**:
  - Each ticket status has a matching label + color token.
  - No raw colors.
  - Tests for the new badge.
- **Effort**: S.
- **Files**: new `packages/ui/src/platform/dispute-resolution/support-ticket-status-badge.tsx`, update `support-ticket-card.tsx`.

---

## Suggested execution bundles

**Bundle A — Trust + safety (top priority)**
- DISPUTES-001 (evidence upload wiring)
- DISPUTES-002 (safety category)
- DISPUTES-006 (statute of limitations)

**Bundle B — Resolution honesty (money flow)**
- DISPUTES-005 (resolution outcome visible to participants)
- DISPUTES-013 (status-aware "what's next" copy)

**Bundle C — Fairness + completeness**
- DISPUTES-007 (welper response surface)
- DISPUTES-009 (message-typed evidence rendering)
- DISPUTES-004 (evidence file rendering — pairs with DISPUTES-001)

**Bundle D — IA + ergonomics**
- DISPUTES-010 (status filter / tabs)
- DISPUTES-012 (withdraw from list)
- DISPUTES-014 (submit button color)
- DISPUTES-008 (drop redundant booking-id field)

**Bundle E — Polish + e2e**
- DISPUTES-003 (description optional)
- DISPUTES-011 (e2e spec)
- DISPUTES-015 (support ticket status badge)
