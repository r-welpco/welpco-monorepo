# Availability – UX and Calendar Management

> Last verified: 2026-07-03 (audit: matches implementation) · relocated from `apps/web/docs/` on 2026-07-04

## Current model (simplified)

1. **Regular schedule** – When you’re usually available (e.g. Mon–Wed 9–17). Stored as time slots (day + start/end time) with a **recurring pattern**.
2. **Exceptions** – One-off overrides for specific dates (e.g. “Unavailable 25 Dec”, “Available 1 Jan 10–14”).

No separate “availability status” card: per-slot status (available/busy/unavailable) was removed to avoid duplication and confusion. Exceptions are the right place for “this date is different.”

---

## Recurring pattern – what it means

**Recurring pattern** applies to the whole schedule: “How often do these same time slots repeat?”

| Pattern  | Meaning |
|----------|--------|
| **Weekly** | These day+time slots repeat every week (e.g. every Monday 9–17). Best fit when you set “Mon, Tue, Wed 9–17”. |
| **Daily**  | The same time window repeats every day. If you only add one slot (e.g. Monday 9–17), the backend still stores it with a day; “Daily” means that conceptually the schedule repeats daily. Use when you’re available the same times every day. |
| **Monthly** | The same day-of-week and times repeat each month (e.g. first Monday of the month 9–17). Less common; use only if you really need monthly recurrence. |

**Implication of changing it**

- Changing the pattern (e.g. Weekly → Daily) does **not** change the list of time slots (days/times). It only changes how that same set of slots is interpreted when calculating “available or not” for a given date.
- Saving always sends the **current** pattern with the current slots; the backend replaces the welper’s calendar with the new set of rows, all with that pattern.
- **Recommendation:** Default to **Weekly** and only show Daily/Monthly if product needs them. Add short in-UI copy (see below) so the user understands the implication.

---

## UI structure (revised)

- **One card: “Regular weekly schedule”**  
  - Add/edit time slots (day + start/end).  
  - Recurring pattern select with short explanation: “How often this schedule repeats (e.g. Weekly = same times every week).”

- **One card: “Availability exceptions”**  
  - Add/remove specific dates as “Available” or “Unavailable” with optional reason.  
  - Copy: “Override your regular schedule for specific dates (e.g. holidays, time off, extra availability).”

No separate “Availability status” / bulk-action card: it duplicated the slot list and didn’t persist, so it was removed to keep the flow clear and efficient.
