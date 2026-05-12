# Domain Catalog — Welpco Functional Architecture v2

> **Last Updated**: April 2026
> **Architecture**: Single NestJS backend (BFF) + Next.js 16 consumer web app + Next.js 16 staff admin app (`@welpco/admin`)

## Overview

This catalog provides a detailed specification for each of the **14 functional domains** that compose the Welpco platform. Every domain runs as an in-process NestJS module inside a single backend application — there are no separate microservice deployments.

### Classification Legend

| Classification | Meaning |
|----------------|---------|
| **Core** | Revenue-generating domains that directly enable the marketplace transaction |
| **Supporting** | Essential domains that enhance the core transaction but are not the transaction itself |
| **Infrastructure** | Cross-cutting technical domains shared by many other domains |
| **AI** | Intelligence and conversational domains that differentiate the platform |

### Priority Legend

| Priority | Meaning |
|----------|---------|
| **Critical** | Must be operational for the marketplace to function |
| **High** | Required for a complete user experience; needed before public launch |
| **Medium** | Enhances the platform; can be phased in post-launch |

---

## Domain 1: User Management & Authentication

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | High |
| **Status** | **Implemented** |

### Purpose

Handles user registration, authentication, authorization, and account lifecycle management. This domain is the entry point for every person who uses Welpco — it issues JWTs, enforces role-based access via CASL, and manages account security policies such as lockout and email verification.

### Key Responsibilities

- User registration (**email/password** implemented; social OAuth not in current scope)
- JWT-based authentication (access + refresh tokens)
- Email verification flow
- Password reset and account recovery
- Role assignment (Customer, Welper, Guardian, **Admin**)
- **Admin** accounts are not self-registered; they are provisioned (e.g. seed / internal ops). Consumer web sign-in rejects Admin so staff use the admin app only.
- Authorization enforcement via CASL ability definitions
- Account lockout after failed attempts
- Referral code generation and tracking
- Session management and token refresh

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `User` | Core identity record: email, hashed password, roles, status |
| `RefreshToken` | Stored refresh tokens for session rotation |
| `Referral` | Referral code and tracking between referrer/referee |
| `VerificationToken` | Email verification and password reset tokens |

### Ownership Recommendation

**Full-stack team / Platform squad.** This domain touches every other domain and should be owned by a team that maintains cross-cutting platform concerns.

---

## Domain 2: Profile Management

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | High |
| **Status** | **Implemented** |

### Purpose

Manages the rich user profiles that power the marketplace — customer preferences, Welper service offerings, availability schedules, and portfolio content. This domain turns an authenticated user into a marketplace participant with searchable, bookable capabilities.

### Key Responsibilities

- Customer profile creation and editing
- Welper profile creation with service offerings
- Availability schedule management (weekly recurring + overrides)
- Service area definition (radius-based or zone-based)
- Profile photo and portfolio media management
- Welper skill/certification listing
- Favorites/saved Welpers for customers
- Profile completeness scoring

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `CustomerProfile` | Customer-specific fields: address, preferences, saved Welpers |
| `WelperProfile` | Welper-specific fields: bio, experience, hourly rate, certifications |
| `ServiceOffering` | Links a Welper to a service category with pricing and description |
| `Availability` | Weekly schedule slots and date-specific overrides |
| `Favorite` | Customer-to-Welper saved relationship |

### Ownership Recommendation

**Marketplace team.** Profiles are central to search relevance and booking quality — the team owning discovery and matching should also own profiles.

---

## Domain 3: Service Discovery & Search

| Attribute | Value |
|-----------|-------|
| **Classification** | Core Domain |
| **Priority** | Critical |
| **Status** | **Implemented** |

### Purpose

Enables customers to find the right Welper for their needs through full-text search, category browsing, location filtering, and availability matching. This is the primary entry point into the booking funnel and directly impacts conversion rates.

### Key Responsibilities

- Full-text search with PostgreSQL `pg_trgm` and `tsvector`
- Category and sub-category browsing
- Location-based filtering (PostGIS distance queries)
- Availability-aware result filtering
- Search result ranking and relevance scoring
- Filter combinations (price range, rating, distance, availability)
- Search analytics and popular query tracking
- Autocomplete and search suggestions

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `ServiceCategory` | Hierarchical category tree (e.g., Cleaning > Deep Clean) |
| `SearchIndex` | Materialized or indexed view optimized for search queries |
| `SearchLog` | Recorded search queries for analytics and AI training |

### Ownership Recommendation

**Marketplace team.** Discovery is the top of the conversion funnel — the team must have full control over ranking, filtering, and relevance tuning.

---

## Domain 4: Job Posting & Matching

| Attribute | Value |
|-----------|-------|
| **Classification** | Core Domain |
| **Priority** | Critical |
| **Status** | Planned |

### Purpose

Provides an alternative to direct booking by letting customers post jobs that Welpers can apply for. The customer reviews applications and selects the best fit. This domain adds flexibility for tasks where the customer wants to compare options before committing.

### Key Responsibilities

- Job post creation with description, budget, schedule, and location
- Job visibility and expiration management
- Welper application submission with cover message and proposed rate
- Application review and shortlisting by customer
- Customer selects Welper → triggers booking creation
- Job status lifecycle (Open → In Review → Awarded → Closed)
- Notification triggers for new applications and selection

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `JobPost` | Customer-created job with requirements, budget, location |
| `JobApplication` | Welper's application including proposed rate and message |
| `JobMatch` | Final selection linking job to the chosen Welper |

### Ownership Recommendation

**Marketplace team.** Closely coupled with search and booking — the same team should own the entire discovery-to-booking funnel.

---

## Domain 5: Booking & Scheduling

| Attribute | Value |
|-----------|-------|
| **Classification** | Core Domain |
| **Priority** | Critical |
| **Status** | **Implemented (core)** |

### Purpose

Manages the end-to-end lifecycle of a service booking from request through completion. The booking entity is the central transaction record of Welpco — it links customer, Welper, service, schedule, payment, and review into a single traceable workflow.

### Key Responsibilities

- Booking request creation (from direct search or job matching)
- Welper acceptance/decline workflow
- Scheduling with date, time, duration, and location
- Booking status lifecycle (pending → accepted → in progress → completed → payment released; `no_show` reserved for legacy/future)
- Customer and Welper check-in / check-out
- Cancellation policies and penalty rules
- Recurring booking support *(not yet implemented)*
- Reminder scheduling (integrates with Notification domain) *(not yet automated)*
- Booking history and rebooking shortcuts *(partial via dashboard)*

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `Booking` | Central transaction: customer, Welper, service, time, status, price |
| `BookingEvent` | Audit trail of status changes with timestamps |
| `RecurringBooking` | Template for repeat bookings on a schedule |
| `CheckInOut` | Timestamps and optional geolocation for service start/end |

### Ownership Recommendation

**Core transaction team.** This is the most critical domain — it must have dedicated ownership with strong testing and monitoring practices.

---

## Domain 6: Payment Processing

| Attribute | Value |
|-----------|-------|
| **Classification** | Core Domain |
| **Priority** | Critical |
| **Status** | **Partial (MVP — platform Stripe, no Connect)** |

### Purpose (implemented MVP)

Processes customer charges on Welpco’s **single Stripe platform account** (no Stripe Connect, no automatic Welper payouts in-app). Card data never touches Welpco servers; Stripe stores cards. Welpco stores Stripe customer ID and default payment method ID on `user_accounts`, and per-booking payment state on `booking_payments`.

**Customer journey:** profile + payment method are completed **after** dashboard access (Settings → Payment), not during onboarding. **Profile completion (Complete)** for customers requires a **default saved payment method** as well as name, phone, and address. **Booking creation** is blocked until that profile is Complete (and the BFF enforces a default PM on `POST /bookings`).

**Booking payment flow:** after the Welper **accepts**, the customer authorizes a **manual-capture** `PaymentIntent` on the saved card. After the service is **completed**, `capture_eligible_at` is set using `application_settings.payment_capture_delay_minutes` (default 30). A scheduler captures eligible authorizations (only while the booking is **completed** and not disputed). On successful capture, the booking becomes **payment_released**. Webhooks are processed synchronously before the HTTP response so Stripe can retry on failure. **Admin** can export captured rows (CSV/JSON) for reconciliation (e.g. Desjardins). Dispute resolutions that refund call Stripe refunds on captured charges where applicable.

See [03-06-Payment-Processing-Domain.md](03-Domain-Details/03-06-Payment-Processing-Domain.md) for detail; webhooks: `setup_intent.succeeded`, `payment_intent.*` (raw body on `POST /api/webhooks/stripe`).

### Key Responsibilities

**Done in MVP**

- Stripe Customer + SetupIntent (save card) + list / default / detach payment methods
- Default payment method required for customer profile Complete and for `POST /bookings`
- Manual-capture PaymentIntent authorization after booking accepted; delayed capture after completion + configured delay
- Webhook-driven sync of payment intent and setup intent outcomes
- Cancel PaymentIntent on booking cancel (when not yet captured); refund helper for captured amounts (disputes)
- Admin export of captured `booking_payments` rows

**Future / not in current codebase**

- Stripe Connect and payouts to Welper connected accounts
- Escrow “release to Welper” via Transfer
- Promo codes, invoices, platform fee lines, scheduled Welper payouts dashboard
- Rich notification templates for every payment event

### Core Data Entities (implemented)

| Entity / table | Description |
|----------------|-------------|
| `user_accounts` | `stripe_customer_id`, `stripe_default_payment_method_id` (nullable) |
| `application_settings` | e.g. `payment_capture_delay_minutes` |
| `booking_payments` | Stripe PaymentIntent id, amounts, status, `capture_eligible_at`, `captured_at`, FKs to booking / customer / welper |

### Ownership Recommendation

**Core transaction team (with fintech expertise).** Payment logic is co-owned with booking and dispute flows. Stripe Connect and payout automation remain future scope.

---

## Domain 7: Communication

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | High |
| **Status** | **Partial** |

### Purpose

Provides booking-scoped messaging between customers and Welpers, as well as support contact forms. Messages are always tied to a booking context to maintain safety boundaries and provide dispute evidence when needed.

### Key Responsibilities

- Booking-scoped chat threads (customer ↔ Welper) — **implemented (REST)**
- Real-time message delivery (WebSocket via Socket.io or polling fallback) — **not implemented**
- Message persistence and history retrieval — **implemented**
- Support contact forms (pre-booking inquiries, general help) — **not implemented**
- File/image attachment support within messages — **not implemented**
- Read receipts and unread count tracking — **not implemented**
- Message content moderation (profanity filter, PII detection) — **not implemented**
- Integration with Notification domain for offline message alerts — **not implemented**

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `ChatThread` | Conversation container linked to a booking |
| `Message` | Individual message with sender, content, timestamp |
| `Attachment` | File or image uploaded within a message |
| `SupportRequest` | Contact form submissions routed to admin |

### Ownership Recommendation

**Experience team.** Communication is a user-facing feature that directly impacts satisfaction and trust. Should be owned alongside the customer experience layer.

---

## Domain 8: Review & Rating

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | High |
| **Status** | **Partial** |

### Purpose

Collects and aggregates post-service reviews and ratings from both customers and Welpers. Reviews build marketplace trust, influence search ranking, and provide critical feedback for quality improvement.

### Key Responsibilities

- Post-service review after booking **completed** or **payment_released** — **implemented**
- Star rating (1–5) with optional text review — **implemented**
- Bidirectional reviews (customer rates Welper, Welper rates customer) — **implemented**
- Review moderation and flagging (abusive content, fake reviews) — **not implemented**
- Aggregate rating calculation per Welper profile — **implemented**
- Review display on Welper profiles and search results — **partial (profile aggregate; surfacing TBD)**
- Review response by Welper (public reply) — **not implemented**
- Review analytics for platform quality monitoring — **not implemented**

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `Review` | Rating, text, reviewer, reviewee, linked booking |
| `ReviewResponse` | Welper's public reply to a customer review |
| `ReviewFlag` | Moderation flag with reason and resolution status |
| `AggregateRating` | Cached average rating and count per Welper |

### Ownership Recommendation

**Experience team.** Reviews are a trust mechanism — the team owning the customer experience should control how reviews are collected, displayed, and moderated.

---

## Domain 9: Safety & Verification

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | Critical (safety) |
| **Status** | Planned |

### Purpose

Ensures platform safety by managing identity verification, background checks, age verification, and guardian consent for services involving minors. This domain is non-negotiable for marketplace trust and regulatory compliance.

### Key Responsibilities

- Welper identity verification (government ID upload + validation)
- Background check integration (third-party provider API)
- Age verification for age-restricted services
- Guardian/parent consent flow for minor-involved bookings
- Verification status tracking and renewal reminders
- Safety badge display on verified Welper profiles
- Compliance reporting for regulatory requirements
- Emergency contact management

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `IdentityVerification` | ID document record with verification status and provider response |
| `BackgroundCheck` | Background check request, status, and result reference |
| `GuardianConsent` | Consent record linking guardian to minor for specific bookings |
| `SafetyBadge` | Verified status badges displayed on Welper profiles |

### Ownership Recommendation

**Trust & safety team (or platform squad if team is small).** This domain has legal and regulatory implications — it needs dedicated attention and cannot be deprioritized.

---

## Domain 10: Dispute Resolution

| Attribute | Value |
|-----------|-------|
| **Classification** | Supporting Domain |
| **Priority** | High |
| **Status** | In progress (partial) |

### Purpose

Manages disputes between customers and Welpers that arise from bookings, as well as general support tickets. Coordinates with Payment for refund processing and with Communication for dispute evidence retrieval.

### Booking integration (BFF)

- Filing a dispute transitions the linked booking to **`disputed`** (see Booking & Scheduling state machine).
- When support records a **resolution**, the booking leaves **`disputed`** in the same transaction: default **`completed`**, or **`cancelled`** when `bookingOutcome` is set to cancel the booking (e.g. void after refund). This keeps the booking lifecycle and dispute resolution aligned.
- **Welper check-out** is only allowed while the booking is **`in_progress`**. A **`disputed`** booking cannot be completed via check-out; exiting **`disputed`** to **`completed`** or **`cancelled`** is done through **`POST /api/disputes/:id/resolution`** (Admin). This avoids bypassing support while an open dispute exists.
- **Cancel from `disputed`**: participants may still **`PATCH /api/bookings/:id/cancel`** (machine allows **`disputed` → `cancelled`**); the dispute row stays **open** until support records a resolution. The **admin app** flags these as **“Cancelled + open dispute”**; the BFF allows **`POST /api/disputes/:id/resolution`** when the booking is already **`cancelled`** and the dispute is still **`open`** or **`in_review`** (dispute → **`resolved`**, booking unchanged).

### Staff admin (BFF + admin app)

- **`POST /api/disputes/:id/resolution`**, **`/api/admin/*`**, and privileged **`GET /api/users/:id`** / **`PUT /api/users/:id/status`** require a JWT for **`AccountType.Admin`** (Welper is not used as an admin stand-in).
- **`@welpco/admin`** (Next.js, e.g. port **8082** in dev): Admin-only credentials sign-in; **`GET /api/disputes`** returns all disputes for admins; dispute detail and resolution UI; optional user directory via **`GET /api/admin/users`**.

### Key Responsibilities

- Dispute filing by customer or Welper against a booking
- Dispute category classification (no-show, quality, overcharge, safety)
- Evidence collection (messages, check-in/out data, photos)
- Admin review workflow with resolution options
- Refund coordination with Payment domain
- Support ticket creation and tracking (non-dispute issues)
- Resolution templates and SLA tracking
- Escalation paths for unresolved disputes

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `Dispute` | Dispute record linked to booking, with category, evidence, status |
| `SupportTicket` | General support request with category and priority |
| `Resolution` | Outcome record with action taken (refund, warning, ban) |
| `EscalationLog` | Audit trail of escalation steps and admin actions |

### Ownership Recommendation

**Trust & safety team.** Dispute resolution has direct financial and reputational impact. Should be co-owned with the team responsible for safety and verification.

---

## Domain 11: Notification

| Attribute | Value |
|-----------|-------|
| **Classification** | Infrastructure Domain |
| **Priority** | High |
| **Status** | **Partial** |

### Purpose

Provides a centralized, multi-channel notification system that other domains use to reach users via email, SMS, and push notifications. This domain owns delivery; the calling domain decides the content and trigger.

### Key Responsibilities

- **Email (transactional)** for booking lifecycle events — **implemented** (SMTP; dev uses Mailhog)
- Multi-channel: SMS (Twilio/SNS), push (FCM/APNs) — **not implemented**
- Notification template management with variable substitution — **partial (inline HTML templates)**
- Delivery scheduling (immediate, delayed, time-zone-aware) — **not implemented** (beyond immediate send)
- User notification preference management (opt-in/out per channel) — **partial (entities exist; product TBD)**
- Delivery status tracking (sent, delivered, failed, bounced) — **partial**
- Rate limiting and deduplication — **not implemented**
- Batch notification support (e.g., weekly digest) — **not implemented**
- Notification history for user and admin viewing — **partial (web routes exist; depth TBD)**

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `NotificationTemplate` | Reusable template with channel, subject, body, and variables |
| `NotificationLog` | Record of every notification sent with delivery status |
| `NotificationPreference` | Per-user channel preferences and quiet hours |
| `ScheduledNotification` | Future-dated notifications queued for delivery |

### Ownership Recommendation

**Platform squad.** Notification is shared infrastructure — it should be owned by the team responsible for cross-cutting platform capabilities.

---

## Domain 12: Content Management

| Attribute | Value |
|-----------|-------|
| **Classification** | Infrastructure Domain |
| **Priority** | Medium |
| **Status** | **Implemented** |

### Purpose

Manages structured content that the platform depends on: service categories, onboarding question libraries, static page content, and holiday calendars. This domain provides reference data consumed by many other domains.

### Key Responsibilities

- Service category hierarchy management (CRUD)
- Onboarding question library (used during Welper/customer profile setup)
- Static content management (FAQ, terms of service, about pages)
- Holiday calendar management (affects scheduling and availability)
- Content versioning and publish/draft workflow
- Content localization support (future: multi-language)
- Admin interface for content editors

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `Category` | Hierarchical service category (parent/child relationship) |
| `Question` | Onboarding or profile question with type and options |
| `StaticContent` | Key-value content blocks for pages (slug → HTML/markdown) |
| `Holiday` | Holiday dates that affect availability and scheduling |

### Ownership Recommendation

**Platform squad.** Content management is shared infrastructure used across the marketplace. The platform team should own the system while business stakeholders manage the content itself.

---

## Domain 13: AI Conversational Experience

| Attribute | Value |
|-----------|-------|
| **Classification** | AI Domain |
| **Priority** | High (differentiator) |
| **Status** | Planned |

### Purpose

Delivers a natural-language conversational interface powered by LLMs that helps customers discover services, book Welpers, and manage their account through text or voice. Uses Vercel AI SDK with generative UI to render interactive components (service cards, calendars, maps) inline within the chat.

### Key Responsibilities

- Conversational intent recognition (book, search, reschedule, cancel, ask)
- Generative UI rendering (service cards, date pickers, confirmation dialogs)
- Voice input support (speech-to-text integration)
- Multi-turn conversation context management
- Tool-calling to orchestrate backend domain actions (search, book, pay)
- Conversation history persistence
- Graceful fallback to human support when AI confidence is low
- Personalized responses based on user history and preferences

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `Conversation` | Chat session with user, model, and message history |
| `ConversationMessage` | Individual message (user, assistant, or tool call) |
| `AIToolCall` | Record of backend actions invoked by the AI (search, book, etc.) |
| `ConversationContext` | Cached user preferences and recent activity for personalization |

### Ownership Recommendation

**AI/ML team (or dedicated AI product engineer).** This domain is a key differentiator — it requires both AI expertise and deep integration knowledge across all other domains.

---

## Domain 14: AI/ML Intelligence Platform

| Attribute | Value |
|-----------|-------|
| **Classification** | AI Domain |
| **Priority** | Medium (phased rollout) |
| **Status** | Planned |

### Purpose

Provides machine learning capabilities that improve the platform over time: smart matching algorithms, demand forecasting, dynamic pricing suggestions, fraud detection, and search relevance optimization. This domain operates as an intelligence layer that other domains consume.

### Key Responsibilities

- Smart Welper-customer matching (beyond basic filters)
- Demand forecasting by service category, location, and time
- Dynamic pricing suggestions for Welpers based on market conditions
- Search result ranking optimization using behavioral signals
- Fraud and anomaly detection (fake reviews, suspicious bookings)
- Recommendation engine (suggested Welpers, related services)
- Model training pipeline management
- A/B testing framework for ML model comparison
- Data pipeline for collecting training data from platform activity

### Core Data Entities

| Entity | Description |
|--------|-------------|
| `MLModel` | Model metadata: version, type, performance metrics, status |
| `PredictionLog` | Individual predictions with input features and output |
| `TrainingDataset` | Curated datasets assembled from platform activity |
| `ABExperiment` | A/B test configuration with variant assignments and results |
| `AnomalyAlert` | Flagged suspicious activity for admin review |

### Ownership Recommendation

**AI/ML team.** Requires specialized ML engineering skills. Should operate as an internal platform team that other squads consume through well-defined interfaces.

---

## Status Tracking Summary

| # | Domain | Classification | Priority | Status |
|---|--------|----------------|----------|--------|
| 1 | User Management & Authentication | Supporting | High | **Implemented** |
| 2 | Profile Management | Supporting | High | **Implemented** |
| 3 | Service Discovery & Search | Core | Critical | **Implemented** |
| 4 | Job Posting & Matching | Core | Critical | Planned |
| 5 | Booking & Scheduling | Core | Critical | **Implemented (core)** |
| 6 | Payment Processing | Core | Critical | **Partial (MVP)** |
| 7 | Communication | Supporting | High | **Partial** |
| 8 | Review & Rating | Supporting | High | **Partial** |
| 9 | Safety & Verification | Supporting | Critical | Planned |
| 10 | Dispute Resolution | Supporting | High | **Partial** |
| 11 | Notification | Infrastructure | High | **Partial** |
| 12 | Content Management | Infrastructure | Medium | **Implemented** |
| 13 | AI Conversational Experience | AI | High | Planned |
| 14 | AI/ML Intelligence Platform | AI | Medium | Planned |

### Progress at a Glance

| Status | Count | Domains |
|--------|-------|---------|
| **Implemented** | 5 | User Management, Profile Management, Service Discovery, Content Management, Booking & Scheduling (core lifecycle) |
| **Partial** | 5 | Payment Processing (platform Stripe; manual Welper payouts), Communication (REST messaging), Review & Rating (core), Notification (transactional email), Dispute Resolution (BFF + admin MVP) |
| **Planned** | 4 | Job Posting & Matching, Safety & Verification (full third-party flows), AI Conversational Experience, AI/ML Intelligence Platform |

---

## Note on Domain Boundaries

All 14 domains are implemented as **NestJS modules within a single backend application**. There are no separate microservice processes, no inter-service HTTP calls, no message queues, and no service mesh.

Domain boundaries are enforced through:

- **Module encapsulation**: Each domain is a NestJS module that explicitly exports only its public service interfaces
- **Import discipline**: Modules declare their dependencies through NestJS `imports` — unauthorized cross-domain access is prevented at the module level
- **Shared database, separate tables**: All domains share one PostgreSQL database but own their own tables; cross-domain data access goes through service methods, never direct table joins from another domain's module
- **Evolutionary architecture**: If a domain needs to scale independently in the future, it can be extracted into its own service — but that is not the current architecture and should not be over-engineered today

This approach gives us the organizational benefits of domain-driven design without the operational complexity of distributed systems.
