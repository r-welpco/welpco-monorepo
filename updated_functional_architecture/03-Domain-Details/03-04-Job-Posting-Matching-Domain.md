# Job Posting & Matching Domain

> **Status**: Planned
> **Classification**: Core
> **Priority**: High
> **Module**: `domains/job-posting/` (to be created)

## Purpose

Provides an alternative path to direct search: customers post specific job requirements, Welpers apply, the customer selects a Welper, and the selection converts into a confirmed booking. Includes a matching algorithm that recommends relevant jobs to Welpers based on category, location, and availability.

## Core Capabilities

### 1. Job Posting

- Customers create job posts with: title, description, category, subcategory, location, preferred date/time, optional budget range
- Posts are visible to all Welpers who serve the matching category and location
- Jobs can be edited only while in `Draft` or `Published` status (before applications arrive)

### 2. Job Applications

- Welpers apply with a proposal message and optional counter-offer (price and/or date)
- Max **20 applications per job** to prevent spam and keep the selection manageable
- Welpers can withdraw applications before acceptance

### 3. Customer Selection

- Customer reviews all applications, views Welper profiles and ratings
- Accepting one application auto-rejects all others
- Acceptance triggers a booking creation in the Booking & Scheduling domain

### 4. Job Lifecycle State Machine

```
                    ┌──────────────┐
                    │    Draft     │
                    └──────┬───────┘
                           │ customer publishes
                    ┌──────▼───────┐
               ┌────│  Published   │────┐
               │    └──────┬───────┘    │
               │           │ first      │ 30 days, no
               │           │ application│ applications
               │    ┌──────▼───────┐    │
               │    │ Applications │    │
               │    │    Open      │    │
               │    └──────┬───────┘    │
               │           │ customer   │
               │           │ selects    │
               │    ┌──────▼───────┐    │
               │    │   Welper     │    │
               │    │  Selected    │    │
               │    └──────┬───────┘    │
               │           │ booking    │
               │           │ created    │
               │    ┌──────▼───────┐  ┌─▼────────────┐
               │    │  Converted   │  │   Expired     │
               │    │  to Booking  │  └───────────────┘
               │    └──────┬───────┘
               │           │ booking
               │           │ completes
               │    ┌──────▼───────┐
               │    │  Completed   │
               │    └──────────────┘
               │
               │    ┌──────────────┐
               └───►│  Cancelled   │  (customer cancels at any point)
                    └──────────────┘
```

### 5. Notification Triggers

| State Transition | Notification | Recipients |
|---|---|---|
| Draft → Published | — | — |
| Published (new application) | "New application on your job" | Customer (email + in-app) |
| Applications Open → Welper Selected | "Your application was accepted" | Selected Welper (email + push) |
| Applications Open → Welper Selected | "Your application was not selected" | Rejected Welpers (email) |
| Any → Cancelled | "Job has been cancelled" | All applicant Welpers (email) |
| Published → Expired (3 days before) | "Your job is expiring soon" | Customer (email) |
| Published → Expired | "Your job has expired" | Customer (email) |
| Welper Selected → Converted to Booking | "Booking confirmed from your job post" | Customer + Welper (email + push) |

### 6. Matching Algorithm

**Phase 1 (MVP — rule-based)**:
1. **Category match**: job category matches Welper's active service offerings
2. **Location match**: job location is within the Welper's service area radius
3. **Availability match**: Welper has availability on the job's preferred date/time
4. **Score**: `categoryMatch(1.0) + locationProximity(0-1.0) + availabilityMatch(0 or 1.0) + ratingBonus(0-0.5)`

**Phase 2 (future — ML-enhanced)**:
- Historical acceptance rate per Welper
- Customer preference patterns
- Demand/supply balance in the area
- Completion rate and review sentiment

## Data Entities

### JobPosting

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `title` | `varchar(200)` | Not null |
| `description` | `text` | Not null |
| `categoryId` | `uuid` | FK → `ServiceCategory.id` |
| `subcategoryId` | `uuid` | FK → `ServiceCategory.id`, nullable |
| `locationAddress` | `varchar(500)` | Not null |
| `locationLat` | `decimal(10,7)` | Not null (geocoded) |
| `locationLng` | `decimal(10,7)` | Not null (geocoded) |
| `preferredDate` | `date` | Not null |
| `preferredTimeStart` | `time` | Not null |
| `preferredTimeEnd` | `time` | Nullable |
| `estimatedDurationHours` | `decimal(4,1)` | Nullable |
| `budgetMin` | `decimal(10,2)` | Nullable |
| `budgetMax` | `decimal(10,2)` | Nullable |
| `status` | `enum` | `Draft`, `Published`, `ApplicationsOpen`, `WelperSelected`, `ConvertedToBooking`, `Completed`, `Expired`, `Cancelled` |
| `applicationCount` | `integer` | Default `0`, denormalized counter |
| `maxApplications` | `integer` | Default `20` |
| `expiresAt` | `timestamptz` | Set to creation + 30 days |
| `selectedApplicationId` | `uuid` | FK → `JobApplication.id`, nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### JobApplication

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `jobPostingId` | `uuid` | FK → `JobPosting.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `proposalMessage` | `text` | Not null, max 2000 chars |
| `proposedPrice` | `decimal(10,2)` | Nullable (counter-offer) |
| `proposedDate` | `date` | Nullable (counter-offer) |
| `proposedTimeStart` | `time` | Nullable |
| `status` | `enum` | `Pending`, `Accepted`, `Rejected`, `Withdrawn` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

**Unique constraint**: `(jobPostingId, welperId)` — a Welper can apply only once per job.

## API Endpoints

All prefixed with `/api/jobs`.

### Job Management (Customer)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/jobs` | Bearer (Customer) | Create a job posting (starts as `Draft`). |
| `GET` | `/jobs/mine` | Bearer (Customer) | List customer's own job postings (paginated). |
| `GET` | `/jobs/:id` | Bearer | Get job details. Customer sees all; Welper sees public fields. |
| `PATCH` | `/jobs/:id` | Bearer (Customer) | Update job (only in `Draft` or `Published`). |
| `POST` | `/jobs/:id/publish` | Bearer (Customer) | Publish a draft job. |
| `POST` | `/jobs/:id/cancel` | Bearer (Customer) | Cancel job (any status except `Completed`). |

### Job Browsing (Welper)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs` | Bearer (Welper) | Browse published jobs. Supports filters: `categoryId`, `lat`, `lng`, `radiusKm`, `page`, `limit`. |
| `GET` | `/jobs/recommended` | Bearer (Welper) | Get AI-matched job recommendations for the Welper. |

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/jobs/:id/applications` | Bearer (Welper) | Submit an application. |
| `GET` | `/jobs/:id/applications` | Bearer (Customer) | List applications for a job (customer only). |
| `POST` | `/jobs/:id/applications/:appId/accept` | Bearer (Customer) | Accept an application → triggers booking creation. |
| `POST` | `/jobs/:id/applications/:appId/reject` | Bearer (Customer) | Reject an application. |
| `POST` | `/jobs/:id/applications/:appId/withdraw` | Bearer (Welper) | Withdraw own application. |
| `GET` | `/jobs/applications/mine` | Bearer (Welper) | List Welper's own applications across all jobs. |

### Example Request/Response

**POST `/api/jobs`**
```json
{
  "title": "Need help moving furniture this Saturday",
  "description": "Moving a couch and dining table from 2nd floor apartment. Need 2-3 hours.",
  "categoryId": "cat-in-home-maintenance",
  "subcategoryId": "cat-moving",
  "locationAddress": "123 Rue Saint-Denis, Montreal, QC H2X 3K4",
  "preferredDate": "2026-02-14",
  "preferredTimeStart": "10:00",
  "estimatedDurationHours": 3,
  "budgetMin": 25,
  "budgetMax": 45
}
```

**Response `201 Created`**
```json
{
  "id": "job-uuid-123",
  "status": "Draft",
  "title": "Need help moving furniture this Saturday",
  "expiresAt": "2026-03-16T00:00:00Z",
  "applicationCount": 0,
  "createdAt": "2026-02-05T14:30:00Z"
}
```

## Business Rules

1. **Profile requirement**: customers must have a completed profile to post jobs. Welpers must have a completed profile and at least one active offering to apply.
2. **Job expiration**: jobs expire **30 days** after creation. A warning notification is sent 3 days before expiration. Expired jobs cannot receive new applications.
3. **Application cap**: max **20 applications per job**. Once reached, the job stops accepting new applications (status remains `ApplicationsOpen` but the endpoint returns `409 Conflict`).
4. **Single acceptance**: accepting one application auto-rejects all others and transitions the job to `WelperSelected`.
5. **Booking conversion**: when a Welper is selected, a booking is automatically created in the Booking & Scheduling domain using the agreed-upon date, time, and price (Welper's counter-offer if accepted, otherwise the Welper's standard hourly rate).
6. **Edit restrictions**: jobs can only be edited in `Draft` or `Published` status. Once applications are received, only cancellation is allowed.
7. **Withdrawal**: Welpers can withdraw applications until the application is accepted or rejected.
8. **One application per Welper per job**: enforced by unique constraint.
9. **Job cancellation**: cancels the job at any stage before `Completed`. Notifies all applicant Welpers.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | User Management | Authenticated user context, customer/Welper roles |
| **Depends on** | Profile Management | Welper profiles for application display, availability for matching |
| **Depends on** | Content Management | Service categories for job categorization |
| **Depends on** | Geocode | Address → coordinates for job location |
| **Depends on** | Notification | Notification delivery for all state transitions |
| **Produces for** | Booking & Scheduling | Creates booking when application is accepted |
| **Produces for** | Communication | Creates job-scoped conversation when application is accepted |

## Security Considerations

- Only the job owner (customer) can view applications, accept, or reject
- Welpers can only see their own applications and public job details
- Job location shows city-level only to Welpers; exact address is shared only after acceptance
- Application proposals are private between the Welper and the customer

## Implementation Plan

### Phase 1 — Core Job Flow (Sprint 1-2)
1. Create `JobPostingModule` with entities, DTOs, and migrations
2. Implement CRUD for job postings with state machine validation
3. Implement application submission and management
4. Implement accept/reject workflow with auto-booking creation
5. Add expiration job (NestJS `@Cron` — daily check for expired jobs)

### Phase 2 — Matching & Recommendations (Sprint 3)
1. Implement rule-based matching algorithm (category + location + availability)
2. Add `/jobs/recommended` endpoint for Welpers
3. Integrate with Notification domain for all state transition alerts

### Phase 3 — Enhancements (Sprint 4+)
1. ML-enhanced ranking (when AI/ML Intelligence domain is available)
2. Job renewal (extend expiration)
3. Job templates (save and reuse job descriptions)
