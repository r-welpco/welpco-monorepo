# Review & Rating Domain

> **Status**: Partial — create review after completed/payment_released; welper aggregate rating; moderation, replies, and analytics not implemented
> **Classification**: Supporting
> **Priority**: High
> **Module**: `domains/review/` (to be created)

## Purpose

Manages post-service reviews and ratings. Customers rate Welpers after service completion, Welpers can respond to reviews, and aggregated ratings feed into search ranking and profile display. Includes moderation, AI-assisted sentiment analysis, and a time-limited review window.

## Core Capabilities

### 1. Review Submission

- Triggered **24 hours after booking completion** via a notification from the Notification domain
- Customer submits: 1-5 star rating + optional text review
- One review per booking (enforced by unique constraint)
- Review window: **30 days** after service completion. After 30 days, the review prompt expires.

### 2. Welper Responses

- Welpers can post **one response per review** (public, visible alongside the review)
- Responses cannot be edited after submission (prevents manipulation)
- Responses are subject to the same moderation rules as reviews

### 3. Review Moderation

**Auto-moderation** (on submission):
- Profanity filter: checks against a configurable word list. Flagged reviews go to `PendingModeration` status.
- Spam detection: reviews shorter than 10 characters with a 5-star rating are auto-published; those with 1-2 stars and < 10 chars are flagged for review.

**Manual moderation** (admin):
- Admin dashboard to review flagged content
- Actions: `Approve`, `Reject` (with reason), `Remove` (published review taken down)
- Rejected reviews are not visible to any user

### 4. Rating Aggregation

- **Weighted average**: recent reviews (last 6 months) weighted 1.5x; older reviews weighted 1.0x
- Formula: `weightedSum / weightedCount`
- Aggregation is recalculated asynchronously when a new review is submitted or an existing one is moderated
- Stored as a materialized summary on the `RatingSummary` entity for fast reads

### 5. Search Ranking Impact

- `averageRating` and `totalReviews` are exposed to the Service Discovery domain
- Higher-rated Welpers appear higher in relevance-sorted search results
- `minRating` filter in search uses the aggregated `averageRating`

### 6. AI Sentiment Analysis (Future)

- After a review is published, queue it for sentiment analysis via the AI/ML Intelligence domain
- Sentiment score: `positive`, `neutral`, `negative`
- Negative sentiment reviews on 4-5 star ratings are flagged for inconsistency review
- Sentiment data feeds into the Welper's reputation profile

## Data Entities

### Review

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id`, unique |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `serviceOfferingId` | `uuid` | FK → `ServiceOffering.id` |
| `rating` | `integer` | 1-5, not null |
| `reviewText` | `text` | Nullable (rating-only reviews allowed) |
| `status` | `enum` | `Published`, `PendingModeration`, `Rejected`, `Removed` |
| `sentimentScore` | `enum` | `Positive`, `Neutral`, `Negative`, nullable (filled by AI) |
| `moderatedBy` | `uuid` | FK → `UserAccount.id` (admin), nullable |
| `moderatedAt` | `timestamptz` | Nullable |
| `moderationReason` | `text` | Nullable (reason for rejection/removal) |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### ReviewResponse

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `reviewId` | `uuid` | FK → `Review.id`, unique (one response per review) |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `responseText` | `text` | Not null, max 1000 chars |
| `status` | `enum` | `Published`, `PendingModeration`, `Rejected` |
| `createdAt` | `timestamptz` | Auto |

### RatingSummary

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `welperId` | `uuid` | FK → `UserAccount.id`, unique |
| `averageRating` | `decimal(3,2)` | Weighted average |
| `totalReviews` | `integer` | Count of published reviews |
| `rating1Count` | `integer` | 1-star count |
| `rating2Count` | `integer` | 2-star count |
| `rating3Count` | `integer` | 3-star count |
| `rating4Count` | `integer` | 4-star count |
| `rating5Count` | `integer` | 5-star count |
| `lastReviewAt` | `timestamptz` | |
| `recalculatedAt` | `timestamptz` | Last aggregation time |

## API Endpoints

All prefixed with `/api/reviews`.

### Customer Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews` | Bearer (Customer) | Submit a review. Body: `{ bookingId, rating, reviewText? }`. |
| `GET` | `/reviews/pending` | Bearer (Customer) | List bookings awaiting review (within 30-day window). |

### Welper Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews/:reviewId/respond` | Bearer (Welper) | Submit a response to a review. |
| `GET` | `/reviews/mine` | Bearer (Welper) | List reviews received (paginated, sorted by date). |
| `GET` | `/reviews/mine/summary` | Bearer (Welper) | Get rating summary (average, distribution). |

### Public

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/reviews/welper/:welperId` | Public | List published reviews for a Welper (paginated). |
| `GET` | `/reviews/welper/:welperId/summary` | Public | Get rating summary for a Welper. |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/reviews/moderation` | Admin | List reviews pending moderation. |
| `POST` | `/reviews/:reviewId/moderate` | Admin | Approve, reject, or remove a review. Body: `{ action, reason? }`. |

## Business Rules

1. **One review per booking**: enforced by unique constraint on `bookingId`. Attempting a second review returns `409 Conflict`.
2. **Review window**: reviews can only be submitted within **30 days** of service completion. After that, the endpoint returns `410 Gone`.
3. **Review prompt**: 24 hours after `ServiceCompleted`, the Notification domain sends a review prompt to the customer.
4. **Rating is required**: a numeric rating (1-5) is mandatory. Text review is optional.
5. **Welper response**: one response per review, immutable after submission. Welpers cannot respond to their own reviews.
6. **Moderation priority**: reviews with 1-2 stars and > 50 words are prioritized in the moderation queue (potential detailed complaints).
7. **Rating recalculation**: happens asynchronously after review submission, moderation action, or removal. Uses weighted formula (recent reviews 1.5x weight).
8. **Anonymous reviews**: customer names are **not shown** to the public on reviews. Only first name initial + last name initial (e.g., "J.D.") are displayed.
9. **Removed reviews**: excluded from aggregation. Removing a review triggers a rating recalculation.
10. **Review editing**: reviews **cannot be edited** after submission. The customer can request removal through Dispute Resolution.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | Booking & Scheduling | `ServiceCompleted` event enables review window |
| **Depends on** | User Management | Customer and Welper identity |
| **Depends on** | Notification | Sends review prompt 24h after completion |
| **Consumed by** | Service Discovery | `averageRating` and `totalReviews` for search ranking and filtering |
| **Consumed by** | Profile Management | Rating summary displayed on Welper profiles |
| **Consumed by** | AI/ML Intelligence (future) | Sentiment analysis of review text |

## Security Considerations

- Only the customer who completed the booking can submit a review
- Only the Welper who was reviewed can submit a response
- Review text is sanitized (HTML stripped) before storage
- Admin moderation actions are logged with the admin user ID and timestamp
- Public review display never shows the customer's full name, email, or profile photo

## Implementation Plan

### Phase 1 — Core Reviews (Sprint 1)
1. Create `ReviewModule` with entities and migrations
2. Review submission endpoint with validation (booking completed, within window, one per booking)
3. Rating aggregation service (weighted average calculation)
4. Public review listing for Welper profiles

### Phase 2 — Responses & Moderation (Sprint 2)
1. Welper response endpoint
2. Auto-moderation (profanity filter, spam detection)
3. Admin moderation queue and actions
4. Rating recalculation on moderation changes

### Phase 3 — AI & Polish (Sprint 3+)
1. Integration with AI/ML Intelligence for sentiment analysis
2. Review prompt scheduling via Notification domain
3. Review analytics dashboard for Welpers
