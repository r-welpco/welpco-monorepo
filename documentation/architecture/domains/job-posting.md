# Job Posting Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/job-posting/`

## Purpose
Customers publish time-boxed job postings; eligible welpers browse and apply; the customer converts a chosen application into a booking (handoff to the booking domain).

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `JobPosting` | `job_postings` | customerId, categoryId, subcategoryId, serviceQuestionCategoryId, answers (jsonb), title, description, scheduledDate/StartTime/EndTime, durationMinutes, locationAddress/lat/lng/city/region, status, applicationCount, maxApplications (default 20), expiresAt, bookingId, publishedAt | `JobPostingStatus`: published, applications_open, converted_to_booking, completed, expired, cancelled |
| `JobApplication` | `job_applications` | jobPostingId, welperId, offeringId, proposalMessage, status, hourlyRateSnapshot | `JobApplicationStatus`: pending, accepted, rejected, withdrawn |

State machine (`job-posting-state-machine.ts`): published → applications_open/cancelled/expired; applications_open → converted_to_booking/cancelled/expired; converted_to_booking → completed; completed/expired/cancelled terminal.

## Services

- `JobPostingService` (`job-posting.service.ts`) — create (expiry = now + `JOB_POSTING_EXPIRY_DAYS`), list mine, browse for welpers (lazy expiry refresh via `job-status.helper.ts`), apply/withdraw, booking handoff (`getBookingHandoff`, `linkBookingFromMarketplace`, `notifyAfterBookingLinked`), admin list/detail.
- `job-eligibility.helper.ts` — offering/subcategory matching and apply-block reasons (discoverability, duplicate application).
- `job-status.helper.ts` — derives expired/completed status from `expiresAt` and linked booking terminal statuses.

## API endpoints (prefix `api`)

Class-level on `job-posting.controller.ts`: `JwtAuthGuard + SignupCompletedGuard`.

| Method | Path | Roles / extra guards |
|---|---|---|
| POST | /api/jobs | customer + EmailVerifiedGuard |
| GET | /api/jobs/mine | customer |
| GET | /api/jobs/applications/mine | welper |
| GET | /api/jobs | welper (browse) |
| GET | /api/jobs/:id | authenticated |
| GET | /api/jobs/:id/applications | customer |
| GET | /api/jobs/:id/applications/:appId/booking-handoff | customer |
| POST | /api/jobs/:id/applications | welper + EmailVerifiedGuard |
| POST | /api/jobs/:id/applications/:appId/withdraw | welper |
| POST | /api/jobs/:id/cancel | customer |

Admin views are exposed at `/api/admin/jobs` and `/api/admin/jobs/:id` (user-management admin controller calling `JobPostingService.adminList/adminFindById`).

## Scheduled jobs
None — expiry is computed lazily on read (`refreshJobStatuses` in `job-status.helper.ts`), not by cron.

## External integrations
None direct.

## Cross-domain dependencies
Imports booking (`BookingModule`, `BookingRequest` entity for handoff/status refresh), profile-management (customer profile, offerings, welper profile), safety-verification (eligibility), content-management (`CategoriesModule` for labels), notification (`NotificationModule` for apply/link events), geocode, and user-management users.

## Key files
- `job-posting.module.ts`, `job-posting.controller.ts`, `job-posting.service.ts`
- `job-posting-state-machine.ts`, `job-eligibility.helper.ts`, `job-status.helper.ts`
- `entities/job-posting.entity.ts`, `entities/job-application.entity.ts`
