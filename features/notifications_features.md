# Notifications — open tickets

Source: Day 13 disputes + notifications functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 3 P1/P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Disputes: `features/disputes_features.md` — `DISPUTES-005` (resolution outcome) needs `NOTIFICATIONS-001` so a customer who steps away gets pinged when their refund clears.
- Messages: `features/messages_features.md` — `MESSAGES-001` (real-time delivery via SSE) is the same push infrastructure that turns notifications from a 30s-poll into a true live signal.
- Booking: `features/booking_features.md` — booking notifications are the only category currently emitting (post-Day 4 Tier 3).

---

## Shipped in the Day 13 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day13-N-01 | P2 | `NotificationCenter` (platform) | `showEmpty` was `!loading || (loading && notifications.length === 0 && filteredNotifications.length === 0)` — when loading with no items, BOTH skeleton block AND the "No notifications yet" empty card rendered. Now `showEmpty = !loading && filteredNotifications.length === 0` and the skeleton block is the only loading affordance. |
| Day13-N-02 | P2 | `NotificationCard` (platform) | Was using raw `green | amber | red | blue` colors for type accent stripe + badge — Day 2 decision 6 violation. Now flows through `SEMANTIC_COLOR` (`success | warning | danger | info`). The radix accent name is resolved once and passed to the inner content component. |
| Day13-N-03 | P2 | `DisputeStatusBadge` (platform; cross-surface) | Catalogued under disputes — the "withdrawn" status correctly resolves through `SEMANTIC_COLOR.neutral`. No change needed; documented for the audit trail. |

---

## NOTIFICATIONS-001 — Only booking events fire notifications (review / payment / dispute / message all silent) [SHIPPED 2026-05-06]

**Status: SHIPPED** — see `apps/web/AUDIT-LOG.md` Day 16 dispatch 2. Every domain now emits per-recipient notifications with category + email + in-app delivery per preference. New shared `NotificationService.emitForUser` helper in `apps/bff/src/domains/notification/notification.service.ts`; per-domain emits in dispute / review / payment / communication services + 10 new unit tests. P0 launch-blocker count: 1 → 0. Original ticket entry preserved below for the audit trail.

- **Priority**: P0 (the notification system is half-built today — every other feature thinks it's wired)
- **Area**: BFF dispute / review / payment / communication services
- **Problem**: `grep "notificationService.send"` across `apps/bff/src/domains/` returns exactly ONE caller — `booking.service.ts:885`. The notification entity supports categories `BOOKING | PAYMENT | REVIEW | SECURITY | SYSTEM`; the FE notification center maps `booking | payment | review | security | system | message`; the unread-count badge polls every 30s. But none of the following emit notifications today:
  - Dispute created → counter-party never gets pinged.
  - Dispute resolved by admin → filer never knows their refund cleared.
  - Review left on a booking → reviewee never knows.
  - Payment captured / refunded → no in-app receipt acknowledgment.
  - Chat message received → only the messages hub knows; the bell stays empty.
  - Security event (new login, password change) → no notification.
  Bible §22.6 honesty: an unread badge that says "0" when something important just happened is a trust break. The notification center's empty state today is largely a lie of omission.
- **Proposed solution**: add a NotificationEventEmitter pattern. Each domain service that mutates user-facing state calls `notificationService.send({...})` with the appropriate category + body + actionUrl. Concretely:
  - `dispute.service.ts:create` → notify the OTHER party with category `system` + actionUrl `/dashboard/disputes/<id>`.
  - `dispute.service.ts:createResolution` → notify the FILER + the OTHER party with category `payment` (when refund) or `system` (otherwise).
  - `dispute.service.ts:withdraw` → notify the OTHER party.
  - `review.service.ts:create` → notify the reviewee with category `review`.
  - `payment.service.ts:capture` → notify the customer with category `payment`.
  - `communication.service.ts:sendMessage` → notify the recipient with category `system` (new "message" category needed, see NOTIFICATIONS-002).
- **Acceptance criteria**:
  - Every state-change in dispute / review / payment / message domain emits one notification per affected user.
  - Dedup window honors `metadata.bookingId` (already in `notification.service.ts:isDuplicate`).
  - Each notification carries a working `metadata.actionUrl`.
  - Email respects per-category preference toggle.
  - Tests: each emitter integration-tests the notification + email path.
- **Effort**: L (cross-cutting; touches 5+ services).
- **Files**: `apps/bff/src/domains/dispute/dispute.service.ts`, `apps/bff/src/domains/review/review.service.ts`, `apps/bff/src/domains/payment/payment.service.ts`, `apps/bff/src/domains/communication/communication.service.ts`, `apps/bff/src/domains/notification/notification.service.ts` (no API change).

---

## NOTIFICATIONS-002 — `MESSAGE` category missing from BFF enum [SHIPPED 2026-05-06]

**Status: SHIPPED** — see `apps/web/AUDIT-LOG.md` Day 16 dispatch 2. `MESSAGE` (and `DISPUTE`) added to `NotificationCategory` enum; preferences endpoint auto-creates default-true rows for the new categories on first read; FE settings page + notifications page-client + bell popover updated. No migration needed (the column is `varchar(32)`, not a PostgreSQL enum).

- **Priority**: P1 (foundational for NOTIFICATIONS-001 message emitter)
- **Area**: BFF notification entity + migration
- **Problem**: `NotificationCategory` enum has `BOOKING | PAYMENT | REVIEW | SECURITY | SYSTEM` — no `MESSAGE`. The web `notifications/page-client.tsx` `CATEGORY_TO_TYPE` map doesn't list `message` either, so even if the BFF emitted it, the FE would fall through to `info`. The platform `NotificationCard` HAS a `message` type; the wiring is half-baked.
- **Proposed solution**: add `MESSAGE = 'message'` to `NotificationCategory` enum + migration to update the DB enum. Update FE `CATEGORY_TO_TYPE` to map `message: "message"`. Update `NotificationPreferences` so users can toggle email + in-app for messages independently.
- **Acceptance criteria**:
  - `MESSAGE` category emits and renders end-to-end.
  - Notification preferences UI shows a "Messages" row.
  - Migration is reversible.
- **Effort**: S.
- **Files**: `apps/bff/src/domains/notification/entities/notification-category.enum.ts`, new migration, `apps/web/app/(dashboard)/dashboard/notifications/page-client.tsx`, `apps/web/components/layout/notification-bell-popover.tsx`.

---

## NOTIFICATIONS-003 — Real-time push (badge + popover lag up to 30s)

- **Priority**: P1
- **Area**: BFF + web
- **Problem**: `useUnreadCount` polls every 30s (`apps/web/lib/hooks/use-notifications.ts:41`). A new dispute / message / review notification can take up to 30 seconds to surface. Day 12 messages audit identified the same gap for messages (MESSAGES-001). The infrastructure is shared — design once, use everywhere.
- **Proposed solution**: SSE endpoint `GET /api/notifications/events` pushes `notification.created` events to the user. The web `useUnreadCount` and `useNotifications` hooks subscribe-on-mount, fall back to 30s polling on connection drop. Same SSE infra as MESSAGES-001 + BOOKING-003.
- **Acceptance criteria**:
  - New notification surfaces in the badge within ~5s.
  - Reconnect on transient drops.
  - Polling fallback when SSE unavailable.
  - No connection thrash on backgrounded tabs (Page Visibility API).
- **Effort**: M (depends on shared pub-sub from MESSAGES-001).
- **Files**: `apps/bff/src/domains/notification/notification.controller.ts`, web hooks.

---

## NOTIFICATIONS-004 — Notifications list pagination missing (caps at 50)

- **Priority**: P1
- **Area**: Web notifications page
- **Problem**: `apps/web/app/(dashboard)/dashboard/notifications/page-client.tsx:44` → `useNotifications({ limit: 50 })` — silently truncates anything older. A heavy user (welper with 100+ bookings) will lose the long tail. The BFF supports `page` + `limit`; the FE doesn't expose it.
- **Proposed solution**: standard pagination footer (matches the disputes list). "Load more" or page-numbered. Default 20 per page.
- **Acceptance criteria**:
  - User can paginate beyond 50.
  - Pagination state survives filter changes.
  - SR-friendly pagination (matches disputes list pattern).
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/notifications/page-client.tsx`.

---

## NOTIFICATIONS-005 — Mark-as-read race: badge can re-show after mark-all-read

- **Priority**: P1
- **Area**: Web hooks
- **Problem**: `useMarkAllAsRead.onSuccess` invalidates `["notifications"]` (`apps/web/lib/hooks/use-notifications.ts:73`). The unread-count query is keyed `["notifications", "unread-count"]` — the `notifications` prefix matches, so it's invalidated. BUT the `useUnreadCount` query has `refetchInterval: 30s` AND `staleTime: 10s` — between the user clicking "Mark all read" and the invalidated refetch landing, a parallel 30s poll can resolve with the OLD count and overwrite the new one (last-write-wins). User sees the badge briefly drop to 0 then jump back to N for ~30s. Bible §22.6 trust contract — a notification badge that flickers is the notification count being honest about lying.
- **Proposed solution**: optimistic update on mark-all-read — `setQueryData(["notifications", "unread-count"], { count: 0 })` BEFORE invalidating. Same for single mark-as-read (decrement by 1). React Query handles the reconciliation cleanly via `cancelQueries`.
- **Acceptance criteria**:
  - Click "Mark all read" → badge drops to 0 immediately.
  - 30s poll cannot un-zero the badge unless a NEW notification arrives.
  - Single mark-as-read decrements optimistically.
  - Tests cover the race.
- **Effort**: S.
- **Files**: `apps/web/lib/hooks/use-notifications.ts`.

---

## NOTIFICATIONS-006 — `NotificationPreferences` reads from a single static list — no per-category surface

- **Priority**: P1
- **Area**: Web settings + platform
- **Problem**: The platform `NotificationPreferences` component groups by channel (email / push) — but the BFF stores preferences keyed by **category** (booking / payment / review / security / system) with email + in-app toggles per row. The web settings page (Day 10) needs a 2D matrix: rows = category, columns = channel. Current single-list-by-channel design loses the category dimension entirely.
- **Proposed solution**: redesign `NotificationPreferences` as a category-row × channel-column matrix. Each row: category label + description + Email switch + In-app switch. SMS column hidden per Day 9 Wave 3 (existing behavior preserved). When NOTIFICATIONS-002 lands, "Messages" row is added with no further code change.
- **Acceptance criteria**:
  - User can independently toggle email + in-app per category.
  - Save reflects round-trip.
  - SR-friendly column headers.
  - Mobile-friendly (collapses gracefully).
- **Effort**: M.
- **Files**: `packages/ui/src/platform/notification/notification-preferences.tsx`, `apps/web/app/(dashboard)/dashboard/settings/page.tsx`.

---

## NOTIFICATIONS-007 — Notification action routing has no fallback / loading state

- **Priority**: P2
- **Area**: Web notifications page + popover
- **Problem**: `handleNotificationAction` calls `router.push(actionUrl)` with no ack to the user. If the link is dead (booking deleted, dispute archived), the user lands on a 404. No "Marking as read…" pulse. No "this notification's target is gone" fallback.
- **Proposed solution**: on click, optimistically mark the notification read THEN navigate. If `actionUrl` returns 404, show an inline note in the destination page: "The original target of this notification is no longer available." (Already partially handled by per-page 404 handling — just needs better empty-state copy.)
- **Acceptance criteria**:
  - Click → mark-as-read → navigate, in that order.
  - Stale notifications surface a clear fallback on the destination.
- **Effort**: S.
- **Files**: `apps/web/components/layout/notification-bell-popover.tsx`, `apps/web/app/(dashboard)/dashboard/notifications/page-client.tsx`.

---

## NOTIFICATIONS-008 — Notification center filter has no `aria-live` for filter changes

- **Priority**: P2
- **Area**: `NotificationCenter`
- **Problem**: When the user switches filter from All → Unread, the list updates but SR users don't get a count announcement. Bible §22 a11y baseline: any meaningful state change should be announced.
- **Proposed solution**: wrap the list in `aria-live="polite" aria-atomic="false"` with a hidden status line ("Showing X unread notifications") that updates on filter change.
- **Acceptance criteria**:
  - SR announces filter change + count.
  - No verbosity for routine list updates (mark-as-read should not announce; only filter changes).
- **Effort**: S.
- **Files**: `packages/ui/src/platform/notification/notification-center.tsx`.

---

## NOTIFICATIONS-009 — Notifications never auto-prune; account history grows unbounded

- **Priority**: P2 (DB cost + UX)
- **Area**: BFF
- **Problem**: No retention policy. A 2-year-old "Welper accepted your booking" notification is not useful. List pagination delays it but doesn't remove it. Bible §22.6: respect the user's signal-to-noise ratio.
- **Proposed solution**: cron / scheduled task — soft-archive notifications older than 90 days (or hard-delete read ones older than 30 days). Configurable.
- **Acceptance criteria**:
  - Old notifications drop off cleanly.
  - Cron job logs metrics.
  - Admin / support can override the window.
  - Tests cover the cutoff math.
- **Effort**: M.
- **Files**: new cron task, `apps/bff/src/domains/notification/notification.service.ts`.

---

## NOTIFICATIONS-010 — `NotificationPreferences` SMS row is hidden via array filter — fragile

- **Priority**: P3
- **Area**: `NotificationPreferences`
- **Problem**: `const categories = ["email", "push"] as const;` (intentionally hardcoded; comment notes "SMS is intentionally hidden per product call (Day 9 Wave 3)"). Fragile — when SMS ships, two places need editing (this filter + the BFF). And the `SMS` `NotificationPreference.category` value is `"sms"` — never `"push"`. The whole `push` channel might be dead code.
- **Proposed solution**: drop `push` from the FE list (no BFF preferences are ever stored as `push`); render only categories that come from the BFF response. When SMS / push ship, the BFF emits the new category and the FE renders it without code change.
- **Acceptance criteria**:
  - Only BFF-supplied categories render.
  - No hardcoded channel list on the FE.
  - Tests cover the empty-channel case.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/notification/notification-preferences.tsx`.

---

## NOTIFICATIONS-011 — Notification badge shows when `unreadCount === 0` momentarily during stale-while-revalidate

- **Priority**: P3
- **Area**: Web notification bell
- **Problem**: `useUnreadCount` has `staleTime: 10s`. When the count resolves to 0, the badge unmounts. On the next 30s tick, if the request is in-flight, the cached `0` is shown — fine. But if the user just received a new notification, the SWR pattern can show `0` briefly before the count refreshes. Cosmetic; mostly fixed by NOTIFICATIONS-003.
- **Proposed solution**: rolled into NOTIFICATIONS-003.
- **Effort**: 0 (tracked here for completeness).

---

## NOTIFICATIONS-012 — No e2e spec for the notification flow

- **Priority**: P2
- **Area**: Web e2e
- **Problem**: Same gap pattern as Day 11 / 12 / 13. No Playwright spec for the notification center, mark-as-read, click-through routing, or preferences round-trip.
- **Proposed solution**: e2e covering: receive booking accept → notification arrives → click → land on booking → notification marked read → unread count decrements.
- **Acceptance criteria**:
  - Spec runs in CI.
  - Covers happy path + 1 stale-link case.
- **Effort**: M.
- **Files**: new `apps/web/e2e/notifications/notifications.spec.ts`.

---

## Suggested execution bundles

**Bundle A — Make notifications honest (top priority)**
- NOTIFICATIONS-001 (every domain emits)
- NOTIFICATIONS-002 (MESSAGE category)
- NOTIFICATIONS-005 (optimistic mark-as-read; stops the badge flicker)

**Bundle B — Real-time + scale**
- NOTIFICATIONS-003 (SSE push)
- NOTIFICATIONS-004 (pagination)
- NOTIFICATIONS-009 (auto-prune)

**Bundle C — Preferences honesty**
- NOTIFICATIONS-006 (category × channel matrix)
- NOTIFICATIONS-010 (drop hardcoded `push`)

**Bundle D — Polish + a11y**
- NOTIFICATIONS-007 (action routing + stale fallback)
- NOTIFICATIONS-008 (aria-live filter announce)
- NOTIFICATIONS-011 (rolled into 003)
- NOTIFICATIONS-012 (e2e spec)
