# Booking & Scheduling Feature – Audit Report

> **Validation: 2026-07-04** (commit b809feb) — historical report; per-finding status below.
>
> The report's unevidenced claim "all listed issues have been addressed" is now **verified accurate** against the current booking domain. 8 resolved · 0 still open · 0 partial · 1 obsolete.
>
> | # | Finding | Status | Evidence (current code) |
> |---|---------|--------|-------------------------|
> | 1 | Cancel 24h window uses server-local time | ✅ resolved | `timezone_offset_minutes` column on `booking_requests` (booking-request.entity.ts:51); cancel computes `scheduledTimeToUtcMs(date, time, offset)` (booking.service.ts ~1306; `booking-schedule-time.ts`) |
> | 2 | No availability check on create | ✅ resolved | `create()` calls `availabilityService.isSlotAvailable(...)` (booking.service.ts:597) and `checkConflictsInTransaction(...)` (line 608) before saving |
> | 3 | Accept race (check-then-save) | ✅ resolved | `accept()` runs inside `dataSource.transaction` with `setLock('pessimistic_write')` + in-transaction conflict check (booking.service.ts:885–913); cancel/state transitions use the same lock |
> | 4 | BookingWizard doesn't collect schedule | ✅ resolved | Wizard has `scheduledDate/StartTime/EndTime` state and includes them + `durationMinutes` in the `onSubmit` payload (booking-wizard.tsx:96–215) |
> | 5 | HH:mm vs HH:mm:ss mismatch | ✅ resolved | `normalizeTime()` slices times to `HH:mm` in all response mappings (booking.service.ts:276–298, 1382–1383) |
> | 6 | ACCEPTED immediately overwritten to CONFIRMED | ⚫ obsolete | `CONFIRMED` no longer exists in `BookingRequestStatus` (removed by migration `20260403000001-RemoveConfirmedBookingStatus`); accept now sets only `ACCEPTED` + `acceptedAt` |
> | 7 | Cancel button only for customer (marked FIXED in report) | ✅ resolved | bookings/page-client.tsx:553 gates on `booking.availableActions?.includes("cancel")` |
> | 8 | Required number question satisfied with 0 | ✅ resolved | `normalizeAnswerValue()` enforces `validationRules.min`/`max` for NUMBER questions and treats empty answers as missing (booking.service.ts:152+) |
> | 9 | Past-booking cancellation fee edge | ✅ resolved | Fee applies only when `hoursUntil < FREE_CANCELLATION_HOURS && hoursUntil >= 0` — the past-booking exclusion is now an explicit bound (booking.service.ts:~1315) |

**Date:** February 5, 2026  
**Scope:** Full booking cycle (create, list, detail, accept, decline, cancel, check-in, check-out) and scheduling (availability, conflicts).

**Status:** All listed issues have been addressed (see fixes below and in code).

---

## Critical / High Priority

### 1. Cancellation 24-hour window uses server local time (timezone bug)

**Location:** `apps/bff/src/domains/booking/booking.service.ts` (cancel method, ~lines 323–325)

**Issue:** The free-cancellation window is computed with:

```ts
const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledStartTime}`);
const hoursUntil = (scheduledDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
```

`YYYY-MM-DDTHH:mm` without timezone is interpreted as **server local time**. If the server runs in UTC and the user/customer is in another timezone (e.g. Montreal), the 24-hour threshold is wrong (e.g. “cancel free until 24h before” can be off by several hours).

**Recommendation:**

- Store timezone (e.g. IANA zone or offset) with the booking when schedule is set, or
- Perform the “within 24h?” check in the client using the user’s local time and only send a “late cancel” flag, or
- At minimum, document that the policy is evaluated in server local time and add a code comment.

---

### 2. No validation against welper availability when creating a booking

**Location:** `apps/bff/src/domains/booking/booking.service.ts` (create method)

**Issue:** Create validates offering, active flag, and service questions, but **does not** check:

- Whether the requested date/time falls within the welper’s **availability calendar** (recurring slots and exceptions), or
- Whether the slot is already taken by another **pending** booking.

Result: customers can create bookings for times when the welper is not available, or when the slot is already requested by someone else. Conflict check only runs on **accept**, so the welper must decline or cancel instead of the system rejecting invalid slots up front.

**Recommendation:**

- Add an availability check at create time:
  - Use `AvailabilityService` (and exceptions) to determine if the requested date/time is an available slot for the welper.
  - Optionally, run a “conflict” check that includes **pending** (and confirmed/in-progress) bookings so only one pending request per slot is allowed.
- If full calendar validation is deferred, at least reject create when the same welper already has a **pending** or **confirmed** booking for the same date/time (reuse or extend `checkConflicts` and call it from `create()`).

---

### 3. Accept flow: possible race when accepting overlapping bookings

**Location:** `apps/bff/src/domains/booking/booking.service.ts` (accept method)

**Issue:** Conflict check and status update are two steps:

1. `checkConflicts(...)` runs; if no conflict, it returns.
2. Then `booking.status = ...` and `save()`.

If two accept requests for overlapping slots are processed concurrently, both can pass `checkConflicts` before either is persisted, leading to two confirmed bookings for the same slot.

**Recommendation:**

- Run conflict check and update inside a **transaction**, or
- Use a **pessimistic lock** (e.g. `SELECT ... FOR UPDATE`) on the welper’s bookings for that date before checking conflicts and saving, or
- Add a **unique constraint** (e.g. welper_id + scheduled_date + time range) and handle constraint violation on save with a clear error.

---

## Medium Priority

### 4. BookingWizard does not collect or send schedule

**Location:** `packages/ui/src/platform/service-discovery/booking-wizard.tsx`

**Issue:** The wizard’s `onSubmit` payload is `{ welperId, offering, answers }`. It does **not** include `scheduledDate`, `scheduledStartTime`, `scheduledEndTime`, or `durationMinutes`. Any app that uses the wizard and calls the booking API with only this payload will create **unscheduled** bookings (valid in the API but not suitable if the product expects a date/time).

**Recommendation:**

- If the wizard is used for “book now” flows, add a step (or fields) to collect date/time/duration and pass them in the payload, then map to the create-booking API.
- If the wizard is only for “request without schedule,” document that and ensure the rest of the app handles unscheduled bookings (e.g. “schedule later” flow).

---

### 5. Create DTO: time format mismatch with DB

**Location:** Backend DTO expects `HH:mm`; PostgreSQL `time` often returns `HH:mm:ss`.

**Issue:** `CreateBookingRequestDto` uses `@Matches(/^\d{2}:\d{2}$/)` for start/end time. The DB stores `time` and may return values like `"09:00:00"`. Conflict check and comparisons work with string compare, but if the API ever validates “same as stored value” or normalizes for display, the mix of `HH:mm` and `HH:mm:ss` can cause inconsistencies.

**Recommendation:** Normalize to a single format (e.g. `HH:mm`) in the response DTO or in the entity transformer so the API contract is consistent.

---

### 6. Accept method: status set to ACCEPTED then immediately overwritten to CONFIRMED

**Location:** `apps/bff/src/domains/booking/booking.service.ts` (accept, ~lines 251–256)

**Issue:** Code sets `booking.status = ACCEPTED` and `acceptedAt = new Date()`, then immediately sets `booking.status = CONFIRMED`. The persisted state is only CONFIRMED; ACCEPTED is never stored. The state machine allows ACCEPTED → CONFIRMED, so this is logically “accept then confirm,” but the code is a bit misleading and there is no `confirmedAt` on the entity.

**Recommendation:** Either set status only to CONFIRMED and keep `acceptedAt` as the acceptance time, or add a `confirmedAt` field and set it when transitioning to CONFIRMED. Optionally add a short comment that “accept” in the API means “accept and confirm” in one step.

---

## Low Priority / UX

### 7. ~~Bookings list: Cancel button only for customer~~ **FIXED**

**Location:** `apps/web/app/(dashboard)/dashboard/bookings/page-client.tsx`

**Fix:** Cancel is now shown for welpers when `booking.availableActions?.includes('cancel')`, so list and detail are consistent.

---

### 8. Required number question can be satisfied with 0

**Location:** `packages/ui/src/platform/service-discovery/booking-wizard.tsx` (QuestionInput for number), backend `isAnswerValid` in `booking.service.ts`

**Issue:** For number inputs, an empty field is sent as `0`. Backend `isAnswerValid` treats any number as valid, so a required “number” question can be submitted with 0. This may or may not be desired (e.g. “Number of children” could be 0).

**Recommendation:** If 0 is not valid for some questions, add question-level validation (e.g. min value) or treat empty number as “no answer” (e.g. send `undefined` and let backend reject required-but-missing).

---

### 9. Past bookings and cancellation policy

**Location:** `booking.service.ts` (cancel)

**Issue:** The 24-hour fee logic only runs when `hoursUntil > 0`. So for a booking whose scheduled time is in the past, the block is skipped and no fee is applied. That is correct; ensure product rules for “cancel after scheduled time” (e.g. no cancel, or different policy) are documented and enforced if needed.

---

## What’s working well

- **State machine:** Clear transitions and `validateTransition` prevent invalid status changes.
- **Authorization:** Only customer or welper can view/cancel; only welper can accept/decline/check-in/check-out; `getBookingForWelper` enforces welper ownership.
- **Conflict check on accept:** Overlapping confirmed/in-progress bookings are detected and reject accept with a clear error.
- **Service questions:** Required and conditional visibility are validated on create.
- **Pricing:** Hourly rate and total are computed and stored; cancellation policy (24h) is implemented with the caveat in §1.
- **Frontend:** New booking page sends full schedule; list/detail use `availableActions` for buttons; mutations invalidate/update queries appropriately.

---

## Suggested next steps

1. **High:** Fix or document cancellation timezone (e.g. store timezone or move 24h check to client).
2. **High:** Add availability (and optionally conflict-with-pending) validation in `create()`.
3. **Medium:** Harden accept with a transaction or lock to avoid race.
4. **Medium:** Align BookingWizard with desired booking flow (schedule vs no-schedule) and API payload.
5. **Low:** Unify list/detail actions for welper (e.g. show Cancel on list when allowed).
