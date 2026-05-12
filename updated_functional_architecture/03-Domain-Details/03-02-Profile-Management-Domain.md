# Profile Management Domain

> **Status**: Implemented
> **Classification**: Core
> **Priority**: Critical
> **Module**: `domains/profile-management/`

## Purpose

Manages customer and Welper profiles, service offerings with per-service pricing and experience, availability calendars with recurring patterns and exceptions, favorite Welpers, and onboarding completion tracking. This domain holds the data that feeds into service discovery, matching, and booking.

## Core Capabilities

### 1. Customer Profiles

- Created automatically when a Customer account is registered
- Stores personal info: name, phone (structured), address (with geocoded coordinates)
- Tracks profile completion percentage and onboarding status
- Customers can set service preferences for personalized search

### 2. Welper Profiles

- Created automatically when a Welper account is registered
- Bio, profile photo URL, service area (lat/lng center + radius or GeoJSON)
- Profile visibility: `public` (appears in search) or `private` (hidden)
- Profile completion requires: name, phone, bio, photo, at least one active service offering
- Onboarding completion is tracked via a `onboardingCompleted` boolean

### 3. Service Offerings

- Each Welper defines **per-service** hourly rate and experience level
- Offerings link to service categories from the Content Management domain
- Optional subcategory selection for more specific services
- Each offering can override the Welper's default service area
- Inactive offerings are hidden from search results

### 4. Availability Calendars

- Recurring weekly patterns: day-of-week + start time + end time
- Supports daily, weekly, and monthly recurrence
- Effective date ranges to limit when a pattern is active
- Welper must set availability before receiving bookings

### 5. Availability Exceptions

- One-off overrides for specific dates (e.g., vacation days, special availability)
- Boolean `available` flag — can mark a normally-available day as unavailable or vice versa
- Optional reason text

### 6. Favorites

- Customers can add any Welper to their favorites list
- Favorites appear in a dedicated "My Favorites" section for quick rebooking
- Optional notes per favorite (e.g., "Great with the kids")

### 7. Onboarding Tracking

- Both customer and Welper profiles track onboarding steps
- Onboarding is marked complete via a dedicated endpoint
- Incomplete onboarding shows progress indicators on the frontend
- Profile completion percentage is calculated server-side based on required fields

## Data Entities

### CustomerProfile

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, unique |
| `firstName` | `varchar(100)` | Not null |
| `lastName` | `varchar(100)` | Not null |
| `phoneCountryCode` | `varchar(5)` | e.g., `+1` |
| `phoneNumber` | `varchar(20)` | |
| `phoneFormatted` | `varchar(30)` | Display format |
| `streetAddress` | `varchar(255)` | |
| `city` | `varchar(100)` | |
| `province` | `varchar(100)` | |
| `postalCode` | `varchar(20)` | |
| `country` | `varchar(100)` | Default `Canada` |
| `latitude` | `decimal(10,7)` | Geocoded |
| `longitude` | `decimal(10,7)` | Geocoded |
| `profileCompletionPct` | `integer` | 0-100, computed |
| `onboardingCompleted` | `boolean` | Default `false` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### WelperProfile

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, unique |
| `firstName` | `varchar(100)` | Not null |
| `lastName` | `varchar(100)` | Not null |
| `phoneCountryCode` | `varchar(5)` | |
| `phoneNumber` | `varchar(20)` | |
| `phoneFormatted` | `varchar(30)` | |
| `bio` | `text` | |
| `profilePhotoUrl` | `varchar(500)` | |
| `serviceAreaLat` | `decimal(10,7)` | Center point |
| `serviceAreaLng` | `decimal(10,7)` | Center point |
| `serviceAreaRadiusKm` | `decimal(5,1)` | Radius in km |
| `profileVisibility` | `enum` | `public`, `private` |
| `profileCompletionPct` | `integer` | 0-100 |
| `onboardingCompleted` | `boolean` | Default `false` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### ServiceOffering

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `welperProfileId` | `uuid` | FK → `WelperProfile.id` |
| `serviceCategoryId` | `uuid` | FK → `ServiceCategory.id` |
| `serviceSubcategoryId` | `uuid` | FK → `ServiceCategory.id`, nullable |
| `description` | `text` | |
| `hourlyRate` | `decimal(10,2)` | Required, per-offering |
| `experienceYears` | `integer` | Required, per-offering |
| `serviceAreaLat` | `decimal(10,7)` | Nullable (overrides profile default) |
| `serviceAreaLng` | `decimal(10,7)` | Nullable |
| `serviceAreaRadiusKm` | `decimal(5,1)` | Nullable |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### AvailabilityCalendar

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `welperProfileId` | `uuid` | FK → `WelperProfile.id` |
| `dayOfWeek` | `integer` | 0 (Sunday) – 6 (Saturday) |
| `startTime` | `time` | e.g., `08:00` |
| `endTime` | `time` | e.g., `17:00` |
| `recurringPattern` | `enum` | `daily`, `weekly`, `monthly` |
| `isAvailable` | `boolean` | Default `true` |
| `effectiveFrom` | `date` | Nullable |
| `effectiveTo` | `date` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### AvailabilityException

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `welperProfileId` | `uuid` | FK → `WelperProfile.id` |
| `date` | `date` | Not null |
| `isAvailable` | `boolean` | Override value |
| `reason` | `varchar(255)` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### FavoriteWelper

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `customerProfileId` | `uuid` | FK → `CustomerProfile.id` |
| `welperProfileId` | `uuid` | FK → `WelperProfile.id` |
| `notes` | `varchar(500)` | Optional |
| `createdAt` | `timestamptz` | Auto |

**Unique constraint**: `(customerProfileId, welperProfileId)` — cannot favorite the same Welper twice.

## API Endpoints

All prefixed with `/api/profiles`.

### Current User Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles/me` | Bearer | Returns the current user's profile (customer or Welper based on role). |
| `PUT` | `/profiles/me` | Bearer | Update current user's profile. |
| `PUT` | `/profiles/me/onboarding-complete` | Bearer | Mark onboarding as complete. |

### Service Offerings (Welper)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles/me/services` | Bearer (Welper) | List all service offerings. |
| `POST` | `/profiles/me/services` | Bearer (Welper) | Create a new service offering. |
| `PUT` | `/profiles/me/services/:id` | Bearer (Welper) | Update an offering. |
| `DELETE` | `/profiles/me/services/:id` | Bearer (Welper) | Deactivate an offering. |

### Availability (Welper)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles/me/availability` | Bearer (Welper) | Get recurring availability patterns. |
| `PUT` | `/profiles/me/availability` | Bearer (Welper) | Set/replace availability calendar. |
| `GET` | `/profiles/me/availability/exceptions` | Bearer (Welper) | List exceptions. |
| `POST` | `/profiles/me/availability/exceptions` | Bearer (Welper) | Add an exception. |
| `DELETE` | `/profiles/me/availability/exceptions/:id` | Bearer (Welper) | Remove an exception. |

### Favorites (Customer)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles/me/favorites` | Bearer (Customer) | List favorite Welpers. |
| `POST` | `/profiles/me/favorites` | Bearer (Customer) | Add a favorite. Body: `{ welperProfileId, notes? }`. |
| `DELETE` | `/profiles/me/favorites/:welperId` | Bearer (Customer) | Remove a favorite. |

### Public Welper Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profiles/welper/:id` | Public | View a Welper's public profile (bio, services, availability, ratings). |

## Business Rules

1. **Profile completion**: customer profiles require name + phone + address **and** a default saved payment method on the linked user account (`user_accounts.stripe_default_payment_method_id`). Welper profiles require name + phone + bio + photo + at least one active offering. Customers cannot create bookings until profile completion is **Complete**; welpers cannot receive bookings with an incomplete welper profile.
2. **Hourly rate and experience are per-offering**, not profile-level. A Welper can charge $25/h for tutoring and $40/h for meal preparation.
3. **Service area inheritance**: offerings without a custom service area inherit the profile-level service area.
4. **Availability precedence**: exceptions override recurring patterns for the specific date.
5. **Onboarding vs payment**: `onboardingCompleted` gates first-time dashboard access (no card in onboarding). Customers may finish onboarding before adding a card; **profile completion** (including payment method) is enforced at booking creation and reflected in `GET /profiles/me` (`profileCompletionStatus`, `hasDefaultPaymentMethod`).
6. **Personalization settings** (theme mode, background color) are client-side only (localStorage) and are not stored in this domain.
7. **Pricing changes** do not retroactively affect existing bookings — only new bookings use the updated rate.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | User Management | User account must exist before profile creation |
| **Depends on** | Content Management | Service category IDs for offerings |
| **Depends on** | Geocode | Address → coordinates for customer/Welper profiles |
| **Consumed by** | Service Discovery | Profile data, offerings, availability for search results |
| **Consumed by** | Booking & Scheduling | Availability calendar for conflict detection |
| **Consumed by** | Job Posting & Matching | Welper profile for application display |
| **Consumed by** | Review & Rating (future) | Displays aggregated ratings on profiles |

## Security Considerations

- All `/profiles/me/*` endpoints require JWT authentication
- Welper-only endpoints (`/services`, `/availability`) are guarded by role-check (`accountType === 'Welper'`)
- Customer-only endpoints (`/favorites`) are guarded by role-check (`accountType === 'Customer'`)
- Public Welper profiles omit sensitive data (phone, email, exact address)
- Profile photo URLs point to an S3 bucket with public-read ACL; no PII in the URL

## Implementation Notes

- `ProfileManagementModule` imports `UserManagementModule` and `GeocodeModule`
- Profile creation is triggered in-process when a user account is created (no event bus)
- The `/profiles/me` endpoint inspects the `@CurrentUser().accountType` to decide which profile entity to query
- Profile completion percentage is recalculated on every profile update (computed field, not stored as a cron job)
- Availability calendar uses bulk upsert — the client sends the full weekly schedule and the server replaces it
