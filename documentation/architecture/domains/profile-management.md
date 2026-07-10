# Profile Management Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/profile-management/`

## Purpose
Owns customer and welper profiles, welper service offerings, weekly availability calendars (with exceptions), and customer favorites. Profile records are created synchronously at signup by `ProfileCreationService`.

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `CustomerProfile` | `customer_profiles` | customerId (unique), firstName, lastName, profilePhotoUrl, phoneNumber (jsonb), dateOfBirth, tos/privacyAcceptedAt, address (jsonb), onboardingCompleted, servicePreferences (jsonb) | uses `ProfileCompletionStatus` |
| `WelperProfile` | `welper_profiles` | welperId (unique), name, bio, phoneNumber (jsonb), profilePhotoUrl, serviceArea (jsonb GeoJSON), latitude/longitude, countryCode, provinceCode, rating, reviewCount, verified, serviceAreaCity, serviceAreaPostalCodes (jsonb), payoutMethodChoice, stripeConnectAccountId, backgroundCheckStepAcknowledged, onboardingCompleted | `ProfileVisibility`: Public, Private · `ProfileCompletionStatus`: Incomplete, Complete · `PayoutMethodChoice`: stripe, skipped |
| `ServiceOffering` | `service_offerings` | welperId, serviceCategoryId, serviceDescription, hourlyRate, experienceYears, subcategoryIds (jsonb), serviceArea (jsonb), active | — |
| `AvailabilityCalendar` | `availability_calendars` | welperId, dayOfWeek, startTime, endTime, recurringPattern, available, effectiveDateStart/End | `DayOfWeek`: Monday…Sunday · `RecurringPattern`: Daily, Weekly, Monthly |
| `AvailabilityException` | `availability_exceptions` | calendarId, date, endDate, available, reason | — |
| `FavoriteWelper` | `favorite_welpers` | customerId, welperId, notes | — |

## Services

- `CustomerProfileService` / `CustomerProfileAggregatesService` — customer profile CRUD, public summary for welpers, aggregate stats.
- `WelperProfileService` / `WelperProfileAggregatesService` — welper profile CRUD, geo fields, rating aggregates; `service-area-radius.util.ts` for radius handling.
- `ServiceOfferingService` — offering CRUD per welper.
- `AvailabilityService` — weekly calendar + exceptions, weekly summary DTO.
- `FavoriteService` — customer favorites CRUD.
- `ProfileCreationService` (`profile-creation/`) — creates the right profile row on signup (synchronous replacement for the old user.created event).
- `EventPublisherService` (`events/`) — stub publisher.

## API endpoints (prefix `api`)

All controllers require `JwtAuthGuard` at class level.

| Method | Path | Roles |
|---|---|---|
| GET | /api/profiles/customer/:customerId/summary | Welper |
| GET | /api/profiles/customer/:customerId | Customer, Admin |
| PUT | /api/profiles/customer/:customerId | Customer |
| PUT | /api/profiles/customer/:customerId/onboarding-complete | Customer |
| GET/POST | /api/profiles/customer/:customerId/favorites · DELETE …/:welperId | customer (class-level) |
| PUT | /api/profiles/welper/:welperId | authenticated |
| PUT | /api/profiles/welper/:welperId/onboarding-complete | authenticated |
| GET | /api/profiles/welper/:welperId/availability | authenticated |
| PUT | /api/profiles/welper/:welperId/availability | welper |
| GET | /api/profiles/welper/:welperId/services | authenticated |
| POST/PUT/DELETE | /api/profiles/welper/:welperId/services(/:serviceId) | welper |
| GET | /api/health | `health/health.controller.ts` |

A `me`-scoped facade also exists at `apps/bff/src/modules/profiles/profiles.controller.ts` (`/api/profiles/me`, `/me/setup-checklist`, `/me/preferences`, `/me/services`, `/me/favorites`, `/me/availability`, …) delegating to these domain services.

## Scheduled jobs
None.

## External integrations
None direct. Stripe Connect account id and payout choice are stored on `WelperProfile` but Stripe calls live in the payment domain.

## Cross-domain dependencies
Imports only `common/auth`. It is a dependency hub: consumed by user-management (signup), service-discovery, job-posting, communication, safety-verification, and the `modules/profiles` facade.

## Key files
- `profile-management.module.ts`, `entities/welper-profile.entity.ts`, `entities/customer-profile.entity.ts`
- `profile-creation/profile-creation.service.ts`
- `welper-profile/welper-profile.service.ts`, `availability/availability.service.ts`
- Facade: `apps/bff/src/modules/profiles/profiles.controller.ts`
