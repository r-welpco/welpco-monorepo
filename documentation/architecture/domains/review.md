# Review Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

`apps/bff/src/domains/review/` — post-booking star ratings and comments between customers and welpers, plus the welper rating aggregate refresh.

## Purpose

After a booking, each participant can leave one review (1–5 rating + optional comment) about the other. Reviews on welpers feed the aggregate rating shown on welper profiles.

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `Review` (`review.entity.ts`) | `reviews` | `bookingId`, `reviewerId`, `revieweeId`, `rating` (smallint 1–5), `comment` (nullable). Unique index on (`bookingId`, `reviewerId`) — one review per participant per booking | `ReviewerType` (`reviewer-type.enum.ts`): `customer`, `welper` |

No status enum — reviews have no lifecycle states.

## Services

### `ReviewService` (`review.service.ts`)

- `create(bookingId, userId, ...)` — requires a "finished" booking (`isReviewableBookingStatus`), asserts the reviewer is a participant, rejects duplicates (unique per reviewer per booking), creates the review (reviewee = the other participant, `reviewerType` from the reviewer's role), refreshes the welper aggregate, and emits a `REVIEW` notification to the reviewee.
- `update()` — reviewer edits their own review.
- `getByBooking(bookingId, userId)` — the caller's review for a booking, or null.
- `getReviewsForWelper(welperId, ...)` — paginated public list of reviews received by a welper.
- `refreshWelperAggregateForReviewee()` (private) — after create/update, recomputes the welper's average rating / review count on the welper profile when the reviewee is a welper.

## API endpoints (`review.controller.ts`)

Class guards: `JwtAuthGuard, SignupCompletedGuard`; prefix `/api`.

| Method | Path | Extra guards | Purpose |
|---|---|---|---|
| POST | `/bookings/:bookingId/review` | — | Create my review for a booking |
| PATCH | `/bookings/:bookingId/review` | — | Update my review |
| GET | `/bookings/:bookingId/review` | — | Get my review for a booking |
| GET | `/welpers/:welperId/reviews` | — | List a welper's received reviews |

## Scheduled jobs

None.

## Cross-domain dependencies

- **booking** — reviews are keyed to `booking_requests`; participant/eligibility checks read the booking ([booking.md](booking.md)).
- **profile-management** — welper rating aggregates updated on the welper profile.

## Key files

- `apps/bff/src/domains/review/review.service.ts`
- `apps/bff/src/domains/review/review.controller.ts`
- `apps/bff/src/domains/review/entities/review.entity.ts`
- `apps/bff/src/domains/review/migrations/20260317000001-CreateReviewsTable.ts`
