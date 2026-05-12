# Dispute Resolution Domain

> **Status**: Partially implemented (BFF MVP)
> **Classification**: Supporting
> **Priority**: Medium
> **Module**: `apps/bff/src/domains/dispute/`

## Purpose

Handles conflicts between customers and Welpers after service delivery. Manages the dispute lifecycle from filing through evidence collection, resolution, and enforcement. Coordinates with Payment Processing for refunds and with Communication for dispute conversations. Provides an admin dashboard for support staff to manage cases.

## Booking lifecycle (implemented in BFF)

The **Booking** aggregate uses status `disputed` when a party files a dispute from eligible statuses (`in_progress`, `completed`, `payment_released`, `no_show`).

| Action | API (approx.) | Booking status | Dispute status |
|--------|----------------|----------------|----------------|
| File dispute | `POST /api/bookings/:bookingId/disputes` | → `disputed` | `open` |
| Resolve (platform **Admin**) | `POST /api/disputes/:id/resolution` | → `completed` (default) or `cancelled` (`bookingOutcome`) | → `resolved` |

Resolution runs in a **single DB transaction** with pessimistic locks on dispute and booking: the booking must be `disputed` before applying a resolution. If `bookingOutcome` is `cancelled`, cancellation fields (`cancelledAt`, `cancelledBy`, `cancellationReason`) are set on the booking.

Welper **check-out** (`PATCH /api/bookings/:id/check-out`) is **not** allowed while the booking is `disputed`; only **`in_progress` → `completed`** uses that endpoint. Exiting `disputed` to `completed` or `cancelled` goes through resolution only.

If a participant **cancels** while the booking was **`disputed`**, the booking becomes **`cancelled`** and the dispute can remain **open**. Admin **`GET /api/disputes`** (and detail) includes **`bookingCancelledWithOpenDispute`** and **`bookingStatus`** for staff triage; **`POST /api/disputes/:id/resolution`** still closes the dispute when the booking is already **`cancelled`** (dispute resolvable, `open` / `in_review` only).

**Automated checks:** `booking-state-machine.spec.ts` (disputed transitions), `dispute.service.spec.ts` (create + resolution), and optional `RUN_DISPUTE_E2E=1` + `test/dispute.e2e-spec.ts` (real Postgres + seed users).

The diagram below describes a **target** rich dispute workflow (evidence phases, appeals). The current MVP uses simpler dispute statuses (`open`, `in_review`, `resolved`, etc.) on the `Dispute` entity while still syncing the booking state as above.

## Core Capabilities

### 1. Dispute Lifecycle State Machine

```
┌──────────┐
│  Filed   │  ← Customer or Welper opens a dispute (within 24h of completion)
└────┬─────┘
     │ Auto-assign to support queue
┌────▼──────────┐
│ UnderReview    │  ← Support staff reviews initial claim
└────┬──────────┘
     │ Request evidence from both parties
┌────▼──────────────────┐
│ EvidenceCollection    │  ← Both parties submit evidence (5-day window)
└────┬──────────────────┘
     │ Support staff makes decision
┌────▼──────────┐
│  Resolution   │  ← Decision communicated, actions taken
└────┬──────────┘
     │
     ├─── No appeal ──► ┌────────┐
     │                   │ Closed │
     │                   └────────┘
     │
     └─── Party appeals ──► ┌──────────┐
                             │ Appealed │ → Senior review → Closed
                             └──────────┘

  ── Auto-escalation ──
  If not resolved within 7 days of filing → escalated to senior support
```

### 2. Evidence Collection

Evidence types accepted:

| Type | Description | Source |
|---|---|---|
| `text` | Written statement from either party | Customer / Welper |
| `images` | Photos of work quality, damage, etc. | Customer / Welper (S3 upload) |
| `booking_data` | Booking details, timestamps, check-in/out | Auto-attached from Booking domain |
| `payment_data` | Transaction amounts, authorization details | Auto-attached from Payment domain |
| `conversation_history` | Full message history from the booking conversation | Auto-attached from Communication domain |

- Evidence submission window: **5 days** from when the dispute enters `EvidenceCollection`
- Both parties are notified when evidence is submitted by the other party
- Late evidence (after window) can be submitted but is marked as `late` and may not be considered

### 3. Resolution Outcomes

| Outcome | Description | Payment Action |
|---|---|---|
| `FullRefund` | Service was not delivered or completely unsatisfactory | Full refund to customer |
| `PartialRefund` | Partial service failure or quality issues | Refund of admin-determined amount |
| `Credit` | Platform credit for future booking | Credit added to customer account |
| `NoAction` | Dispute is unfounded or insufficient evidence | Payment released to Welper |
| `AccountWarning` | Policy violation by either party | Warning recorded + potential restrictions |
| `AccountSuspension` | Severe or repeated violations | Account suspended pending review |

### 4. Auto-Escalation

- Disputes not resolved within **7 days** of filing are auto-escalated
- Escalated disputes are flagged in the admin dashboard and assigned to senior support
- Escalation notification sent to the support team lead

### 5. Appeal Process

- Either party can appeal a resolution within **7 days** of the resolution decision
- Appeals are reviewed by a different support staff member (senior)
- Appeal can result in: same outcome confirmed, modified outcome, or overturned
- Only one appeal per dispute is allowed

## Data Entities

### Dispute

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `filedBy` | `uuid` | FK → `UserAccount.id` |
| `filedAgainst` | `uuid` | FK → `UserAccount.id` |
| `disputeType` | `enum` | `UnsatisfactoryService`, `NoShow`, `PaymentIssue`, `PropertyDamage`, `SafetyConcern`, `Other` |
| `description` | `text` | Not null, max 5000 chars |
| `status` | `enum` | `Filed`, `UnderReview`, `EvidenceCollection`, `Resolution`, `Closed`, `Appealed` |
| `priority` | `enum` | `Low`, `Medium`, `High`, `Urgent` |
| `assignedTo` | `uuid` | FK → `UserAccount.id` (admin), nullable |
| `escalatedAt` | `timestamptz` | Nullable |
| `evidenceDeadline` | `timestamptz` | 5 days after entering EvidenceCollection |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### DisputeEvidence

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `disputeId` | `uuid` | FK → `Dispute.id` |
| `submittedBy` | `uuid` | FK → `UserAccount.id` |
| `evidenceType` | `enum` | `Text`, `Image`, `BookingData`, `PaymentData`, `ConversationHistory` |
| `content` | `text` | For text evidence |
| `fileUrl` | `varchar(500)` | S3 URL for images/documents |
| `isAutoAttached` | `boolean` | `true` for system-gathered evidence |
| `isLate` | `boolean` | Submitted after evidence window |
| `createdAt` | `timestamptz` | Auto |

### DisputeResolution

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `disputeId` | `uuid` | FK → `Dispute.id` |
| `outcome` | `enum` | `FullRefund`, `PartialRefund`, `Credit`, `NoAction`, `AccountWarning`, `AccountSuspension` |
| `refundAmount` | `decimal(10,2)` | Nullable |
| `creditAmount` | `decimal(10,2)` | Nullable |
| `decisionRationale` | `text` | Not null (admin explains decision) |
| `resolvedBy` | `uuid` | FK → `UserAccount.id` (admin) |
| `resolvedAt` | `timestamptz` | Not null |

### DisputeAppeal

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `disputeId` | `uuid` | FK → `Dispute.id`, unique |
| `appealedBy` | `uuid` | FK → `UserAccount.id` |
| `appealReason` | `text` | Not null |
| `originalOutcome` | `enum` | Same as resolution outcomes |
| `newOutcome` | `enum` | Nullable (filled after review) |
| `newDecisionRationale` | `text` | Nullable |
| `reviewedBy` | `uuid` | FK → `UserAccount.id` (senior admin) |
| `status` | `enum` | `Pending`, `Confirmed`, `Modified`, `Overturned` |
| `createdAt` | `timestamptz` | Auto |
| `resolvedAt` | `timestamptz` | Nullable |

### DisciplinaryAction

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `disputeId` | `uuid` | FK → `Dispute.id` |
| `actionType` | `enum` | `Warning`, `TemporarySuspension`, `PermanentSuspension` |
| `reason` | `text` | Not null |
| `expiresAt` | `timestamptz` | Nullable (for temporary suspensions) |
| `status` | `enum` | `Active`, `Expired`, `Revoked` |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/disputes`.

### User Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/disputes` | Bearer | File a dispute. Body: `{ bookingId, disputeType, description }`. |
| `GET` | `/disputes` | Bearer | List current user's disputes (filed by or against). |
| `GET` | `/disputes/:id` | Bearer | Get dispute details (participant or admin). |
| `POST` | `/disputes/:id/evidence` | Bearer | Submit evidence. Body: `{ evidenceType, content?, fileUrl? }`. |
| `POST` | `/disputes/:id/appeal` | Bearer | Appeal a resolution. Body: `{ appealReason }`. |

### Admin Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/disputes/admin` | Admin | List all disputes with filters: `status`, `priority`, `assignedTo`. |
| `POST` | `/disputes/:id/assign` | Admin | Assign dispute to support staff. Body: `{ adminUserId }`. |
| `POST` | `/disputes/:id/advance` | Admin | Move dispute to next status. Body: `{ status }`. |
| `POST` | `/disputes/:id/resolve` | Admin | Resolve a dispute. Body: `{ outcome, refundAmount?, creditAmount?, rationale }`. |
| `POST` | `/disputes/:id/appeal/review` | Admin (Senior) | Review an appeal. Body: `{ newOutcome?, rationale, status }`. |

## Business Rules

1. **Filing window**: disputes can only be filed within **24 hours** of booking completion (or within 48 hours for `NoShow` type).
2. **One dispute per booking**: a second dispute for the same booking returns `409 Conflict`.
3. **Evidence deadline**: 5 days from when the dispute enters `EvidenceCollection`. Late evidence is accepted but flagged.
4. **Auto-escalation**: unresolved disputes are escalated after 7 days via a daily cron job.
5. **Auto-attached evidence**: when a dispute is filed, the system automatically attaches booking details, payment data, and conversation history.
6. **Appeal limit**: one appeal per dispute. The appeal is reviewed by a different admin than the original resolver.
7. **Priority assignment**: `SafetyConcern` disputes are auto-assigned `Urgent` priority. `NoShow` is `High`. Others default to `Medium`.
8. **Refund coordination**: all refund outcomes trigger the Payment Processing domain to process the refund via Stripe.
9. **Account actions**: `AccountWarning` and `AccountSuspension` are recorded and visible to admins. Three warnings within 12 months trigger an automatic review.
10. **Response time SLA**: within 48 hours of filing for initial acknowledgment (as per platform policy).

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | Booking & Scheduling | Booking data for dispute context |
| **Depends on** | Payment Processing | Transaction data; refund processing |
| **Depends on** | Communication | Conversation history as evidence |
| **Depends on** | User Management | User accounts for participants and admins |
| **Depends on** | Notification | Notifications at every status transition |
| **Produces for** | Payment Processing | Refund and credit instructions |
| **Produces for** | User Management | Disciplinary actions (warnings, suspensions) |

## Security Considerations

- Dispute details are only visible to the two parties and assigned admin staff
- Evidence files are stored in a private S3 bucket (not publicly accessible)
- Admin actions are audit-logged with the admin's user ID and timestamp
- Dispute resolution rationale is required and stored for accountability
- Sensitive booking and payment data auto-attached to disputes is redacted for non-admin viewers (e.g., last 4 digits of payment)

## Implementation Plan

### Phase 1 — Core Dispute Flow (Sprint 1-2)
1. Create `DisputeModule` with entities and migrations
2. Dispute filing with auto-evidence attachment
3. Status progression (Filed → UnderReview → EvidenceCollection → Resolution → Closed)
4. User evidence submission endpoint

### Phase 2 — Admin Dashboard (Sprint 3)
1. Admin dispute listing with filters and sorting
2. Dispute assignment and resolution workflow
3. Refund integration with Payment Processing domain
4. Auto-escalation cron job (7-day rule)

### Phase 3 — Appeals & Enforcement (Sprint 4)
1. Appeal submission and senior review workflow
2. Disciplinary action recording
3. Account warning/suspension enforcement via User Management domain
4. Dispute analytics and reporting
