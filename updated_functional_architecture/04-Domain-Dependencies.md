# Domain Dependencies — Welpco Functional Architecture v2

> **Last Updated**: April 2026
> **Architecture**: Single NestJS backend (BFF) + Next.js 16 web + Next.js 16 admin

## Overview

This document maps the dependencies between Welpco's 14 functional domains, defines the integration patterns used, and provides a recommended implementation order based on dependency resolution. All inter-domain communication happens through **in-process method calls** within a single NestJS application.

---

## Dependency Matrix

The table below shows which domains depend on which. Read rows as **"Domain X depends on →"** the columns marked with `●`. A `○` indicates an optional or event-based dependency.

| Domain ↓ depends on → | 1. User | 2. Profile | 3. Search | 4. Job | 5. Booking | 6. Payment | 7. Comm | 8. Review | 9. Safety | 10. Dispute | 11. Notif | 12. Content | 13. AI Chat | 14. AI/ML |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1. User Management** | — | | | | | | | | | | | | | |
| **2. Profile** | ● | — | | | | | | | | | ● | ● | | |
| **3. Search** | ● | ● | — | | | | | ● | ● | | | ● | | ○ |
| **4. Job Posting** | ● | ● | | — | | | | | | | ● | ● | | |
| **5. Booking** | ● | ● | | ○ | — | | | | | | ● | ● | | |
| **6. Payment** | ● | | | | ● | — | | | | | ● | | | |
| **7. Communication** | ● | | | | ● | | — | | | | ● | | | |
| **8. Review** | ● | ● | | | ● | | | — | | | ● | | | |
| **9. Safety** | ● | ● | | | | | | | — | | ● | | | |
| **10. Dispute** | ● | | | | ● | ● | ○ | | | — | ● | | | |
| **11. Notification** | ● | | | | | | | | | | — | ● | | |
| **12. Content** | | | | | | | | | | | | — | | |
| **13. AI Chat** | ● | ● | ● | ● | ● | ● | | | | | ● | ● | — | ○ |
| **14. AI/ML** | | ● | ● | | ● | | | ● | | | | ● | | — |

**Legend**: `●` = direct dependency (synchronous method call) | `○` = optional/event-based dependency | blank = no dependency

### Dependency Count Summary

| Domain | Depends On (count) | Depended On By (count) |
|--------|-------------------|----------------------|
| 1. User Management | 0 | 12 |
| 2. Profile | 3 | 7 |
| 3. Search | 6 | 2 |
| 4. Job Posting | 4 | 2 |
| 5. Booking | 5 | 7 |
| 6. Payment | 3 | 2 |
| 7. Communication | 3 | 1 |
| 8. Review | 4 | 2 |
| 9. Safety | 3 | 1 |
| 10. Dispute | 5 | 0 |
| 11. Notification | 2 | 10 |
| 12. Content | 0 | 8 |
| 13. AI Chat | 9 | 0 |
| 14. AI/ML | 4 | 2 |

**Key observations**:
- **User Management** and **Content Management** have zero dependencies — they are foundation domains
- **Notification** is depended on by 10 domains — it is critical shared infrastructure
- **AI Conversational Experience** has the most dependencies (9) — it orchestrates across the entire platform
- **Dispute Resolution** and **AI Chat** are leaf domains — nothing depends on them

---

## Primary Transaction Flow

The core marketplace transaction passes through the following domains in sequence:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRIMARY TRANSACTION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
  │  1. User  │────▶│ 2. Profile│────▶│ 3. Search │────▶│ 4. Job Post  │
  │  Mgmt     │     │  Mgmt     │     │ & Browse  │     │ (optional)   │
  └──────────┘     └──────────┘     └──────────┘     └──────┬───────┘
                                         │                    │
                                         │   Direct Book      │  Job Award
                                         ▼                    ▼
                                    ┌──────────────────────────┐
                                    │  5. Booking & Scheduling  │
                                    └────────────┬─────────────┘
                                                 │
                               ┌─────────────────┼─────────────────┐
                               ▼                 ▼                 ▼
                        ┌────────────┐   ┌────────────┐   ┌────────────┐
                        │ 6. Payment │   │ 7. Comms   │   │ 9. Safety  │
                        │ (escrow    │   │ (booking   │   │ (verify    │
                        │  hold)     │   │  chat)     │   │  before    │
                        └─────┬──────┘   └────────────┘   │  service)  │
                              │                           └────────────┘
                              │ Service completes
                              ▼
                        ┌────────────┐   ┌────────────┐   ┌────────────┐
                        │ 6. Payment │   │ 8. Review  │   │10. Dispute │
                        │ (release   │──▶│ & Rating   │   │ (if needed)│
                        │  to Welper)│   └────────────┘   └────────────┘
                        └────────────┘

  ── Cross-cutting throughout: ──────────────────────────────────────────
  │ 11. Notification │ 12. Content (categories, reference data)         │
  ───────────────────────────────────────────────────────────────────────
```

### Flow Description

1. **User Management** — Customer registers and authenticates
2. **Profile Management** — Customer completes profile; Welper sets up service offerings
3. **Service Discovery** — Customer searches for services by category, location, or keyword
4. **Job Posting** *(optional path)* — Customer posts a job; Welpers apply; customer awards
5. **Booking & Scheduling** — Booking is created (direct or via job award), Welper accepts
6. **Payment Processing** — Payment hold created at booking confirmation
7. **Communication** — Customer and Welper chat within booking context
8. **Safety & Verification** — Welper verification checked before first service
9. **Payment Processing** — Payment released to Welper after service completion
10. **Review & Rating** — Both parties leave reviews
11. **Dispute Resolution** — Filed only if there is a problem with the service

**Notification** (Domain 11) fires alerts at every major state transition. **Content Management** (Domain 12) provides reference data (categories, holidays) throughout.

---

## AI-Augmented Flow

When the AI Conversational Experience domain is active, it provides an alternative entry point that orchestrates the same underlying domains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AI-AUGMENTED FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐
  │  Customer opens Chat  │
  │  (text or voice)      │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐     ┌───────────────────────────────────┐
  │ 13. AI Conversational │────▶│  LLM understands intent:          │
  │     Experience        │     │  "I need someone to clean my      │
  └──────────┬───────────┘     │   house next Saturday"            │
             │                  └───────────────────────────────────┘
             │
             │  AI tool calls (in-process)
             │
             ├──▶ 3. Search    → Find available cleaners nearby
             │
             ├──▶ 2. Profile   → Retrieve top Welper details
             │
             ├──▶ Generative UI → Render service cards + calendar picker
             │
             ├──▶ 5. Booking   → Create booking on user confirmation
             │
             ├──▶ 6. Payment   → Initiate payment hold
             │
             └──▶ 11. Notification → Send booking confirmation
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ML INTELLIGENCE PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────┘

  Platform Activity (bookings, searches, reviews)
             │
             ▼
  ┌──────────────────────┐
  │ 14. AI/ML Intelligence│
  │     Platform          │
  └──────────┬───────────┘
             │
             ├──▶ 3. Search    → Improved result ranking
             │
             ├──▶ 2. Profile   → Welper score optimization
             │
             ├──▶ 5. Booking   → Demand forecasting
             │
             ├──▶ 8. Review    → Fraud detection on reviews
             │
             └──▶ 12. Content  → Category trend analysis
```

---

## Integration Patterns

### Pattern 1: In-Process Method Calls (Primary)

All domain-to-domain communication uses **direct method invocation** through NestJS dependency injection. There is no HTTP, no gRPC, no Kafka, and no message queues.

```
// Example: Booking domain calls Payment domain
@Injectable()
export class BookingService {
  constructor(
    private readonly paymentService: PaymentService,  // injected
    private readonly notificationService: NotificationService,
  ) {}

  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOneOrFail(bookingId);

    // Direct method call — same process, same event loop
    await this.paymentService.createHold(booking);

    // Another direct call
    await this.notificationService.send({
      userId: booking.customerId,
      template: 'booking-confirmed',
      data: { bookingId: booking.id },
    });

    return booking;
  }
}
```

**Why this pattern**:
- Simplest possible integration — no network latency, no serialization
- Full TypeScript type safety across domain boundaries
- Shared database transaction when needed (same TypeORM connection)
- Easy to debug — single stack trace across domains

**Trade-off acknowledged**: Domains are coupled at the process level. If we ever need independent scaling, we extract a domain into its own service and replace the method call with an HTTP/gRPC call behind an interface. The NestJS module boundary makes this refactor straightforward.

### Pattern 2: In-Process Events (Secondary — Fire-and-Forget)

For cases where a domain wants to notify others without waiting for a response, we use **EventEmitter2** within the same Node.js process.

```
// Publisher: Booking domain emits event after completion
@Injectable()
export class BookingService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async completeBooking(bookingId: string): Promise<void> {
    await this.bookingRepo.update(bookingId, { status: 'completed' });

    // Fire-and-forget — does not await listeners
    this.eventEmitter.emit('booking.completed', {
      bookingId,
      customerId: booking.customerId,
      welperId: booking.welperId,
    });
  }
}

// Subscriber: Review domain listens for the event
@Injectable()
export class ReviewListener {
  @OnEvent('booking.completed')
  async handleBookingCompleted(payload: BookingCompletedEvent): Promise<void> {
    await this.reviewService.promptForReview(payload.customerId, payload.bookingId);
  }
}
```

**When to use events vs. direct calls**:

| Use Direct Call When | Use Event When |
|---------------------|----------------|
| The caller needs the result | The caller does not need the result |
| Failure should roll back the caller | Failure should not affect the caller |
| There is exactly one consumer | There may be multiple consumers |
| The operation is part of the same transaction | The operation is a side effect |

**Examples of event usage**:
- `booking.completed` → Review prompts user, Notification sends summary, AI/ML logs data
- `review.created` → Search updates aggregate rating, Notification alerts Welper
- `payment.released` → Notification sends payout confirmation

### Pattern 3: Shared Database with Domain-Owned Tables

All domains share a single PostgreSQL database. Each domain owns its tables and exposes data through service methods. Cross-domain data access rules:

- **Allowed**: Domain A calls Domain B's service method to retrieve data
- **Not allowed**: Domain A directly queries Domain B's tables from its own repository
- **Shared references**: Foreign keys to common identifiers (User ID, Booking ID) are allowed in any domain's tables

---

## Dependency Resolution Order

The implementation order is determined by resolving the dependency graph from the bottom up. Domains with zero dependencies are built first; domains that depend on many others are built last.

### Phase 1: Foundation (No Dependencies)

| Order | Domain | Rationale |
|-------|--------|-----------|
| 1 | **Content Management** | Reference data (categories, questions, holidays) needed by many domains. Already implemented. |
| 2 | **User Management & Auth** | Every other domain requires authenticated users. Already implemented. |

### Phase 2: Identity & Discovery (Depends on Foundation)

| Order | Domain | Rationale |
|-------|--------|-----------|
| 3 | **Profile Management** | Depends on User + Content. Needed before search or booking. Already implemented. |
| 4 | **Notification** | Depends on User + Content. Needed by almost every domain for alerts. **Partial** (transactional email implemented). |
| 5 | **Service Discovery & Search** | Depends on User, Profile, Content. Top of the booking funnel. Already implemented. |

### Phase 3: Core Transaction (Depends on Discovery)

| Order | Domain | Rationale |
|-------|--------|-----------|
| 6 | **Booking & Scheduling** | Depends on User, Profile, Content, Notification, Payment. Central transaction domain — **core lifecycle implemented**; recurring/reminders TBD. |
| 7 | **Safety & Verification** | Depends on User, Profile, Notification. Must be ready before first real booking with a new Welper. |
| 8 | **Payment Processing** | Depends on User, Booking, Notification. **Partial** — platform Stripe MVP; manual Welper payouts. |
| 9 | **Job Posting & Matching** | Depends on User, Profile, Content, Notification. Alternative to direct booking. |

### Phase 4: Post-Transaction & Trust (Depends on Booking)

| Order | Domain | Rationale |
|-------|--------|-----------|
| 10 | **Communication** | Depends on User, Booking, Notification. **Partial** — REST messaging; real-time TBD. |
| 11 | **Review & Rating** | Depends on User, Profile, Booking, Notification. **Partial** — core reviews + aggregate. |
| 12 | **Dispute Resolution** | Depends on User, Booking, Payment, Notification. **Partial** — BFF + admin MVP. |

### Phase 5: AI & Intelligence (Depends on Everything)

| Order | Domain | Rationale |
|-------|--------|-----------|
| 13 | **AI/ML Intelligence Platform** | Depends on Profile, Search, Booking, Review, Content. Needs data from operational domains. |
| 14 | **AI Conversational Experience** | Depends on 9 domains. Orchestration layer — build last when all other domains are stable. |

### Visual Implementation Order

```
Phase 1 ─── Content Management ──────────────────────────┐
         └── User Management ────────────────────────────┤
                                                          │
Phase 2 ─── Profile Management ──────────────────────────┤
         ├── Notification ───────────────────────────────┤
         └── Service Discovery ──────────────────────────┤
                                                          │
Phase 3 ─── Booking & Scheduling ────────────────────────┤
         ├── Safety & Verification ──────────────────────┤
         ├── Payment Processing ─────────────────────────┤
         └── Job Posting & Matching ─────────────────────┤
                                                          │
Phase 4 ─── Communication ──────────────────────────────┤
         ├── Review & Rating ────────────────────────────┤
         └── Dispute Resolution ─────────────────────────┤
                                                          │
Phase 5 ─── AI/ML Intelligence ──────────────────────────┤
         └── AI Conversational Experience ───────────────┘
```

---

## Shared Concepts

Certain identifiers are referenced across multiple domain boundaries. These are **shared references** — not shared entities. Each domain stores the ID as a foreign key but does not own or manage the referenced entity.

### Shared Identifier: User ID

| Used In | How |
|---------|-----|
| Profile Management | Links profile to authenticated user |
| Booking & Scheduling | `customerId`, `welperId` on every booking |
| Payment Processing | Stripe customer and connected account mapping |
| Communication | Message sender and thread participants |
| Review & Rating | Reviewer and reviewee identification |
| Safety & Verification | Welper identity and background check subject |
| Dispute Resolution | Filing party and respondent |
| Notification | Delivery target for all notifications |
| AI Chat | Conversation owner and personalization source |

**Owner**: User Management domain. All other domains reference `user.id` as a foreign key.

### Shared Identifier: Booking ID

| Used In | How |
|---------|-----|
| Payment Processing | Links payment intent to the booking |
| Communication | Scopes chat threads to a specific booking |
| Review & Rating | Links review to the completed booking |
| Dispute Resolution | Links dispute to the contested booking |
| Notification | References booking in alert messages |
| AI/ML Intelligence | Training data keyed by booking |

**Owner**: Booking & Scheduling domain. All other domains reference `booking.id` as a foreign key.

### Shared Identifier: Service Category ID

| Used In | How |
|---------|-----|
| Profile Management | Welper service offerings reference category |
| Service Discovery & Search | Search filters and result grouping |
| Job Posting & Matching | Job posts specify required service category |
| Booking & Scheduling | Booking records the service category performed |
| AI/ML Intelligence | Demand forecasting and trend analysis per category |

**Owner**: Content Management domain. All other domains reference `category.id` as a foreign key.

### Rules for Shared References

1. **Always go through the owning domain's service** to resolve a reference into a full entity. Never query another domain's table directly.
2. **Store only the ID** in your domain's tables. Do not denormalize fields from the referenced entity unless there is a strong performance reason (and document it).
3. **Cascading deletes are prohibited** across domain boundaries. If a user is deactivated, each domain handles its own cleanup logic through events or explicit service calls.
4. **Type safety**: Shared IDs should use branded types or value objects (e.g., `UserId`, `BookingId`) to prevent accidental misuse across domains.

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Communication** | In-process method calls (NestJS DI) |
| **Async Events** | EventEmitter2 (in-process, fire-and-forget) |
| **Database** | Single PostgreSQL instance, domain-owned tables |
| **No HTTP between domains** | Correct — all calls are function invocations |
| **No Kafka / RabbitMQ** | Correct — no message queues |
| **No service mesh** | Correct — single process |
| **Shared data** | Via foreign key references + service method calls |
| **Future extraction** | Possible per-domain; NestJS modules are the seam |
