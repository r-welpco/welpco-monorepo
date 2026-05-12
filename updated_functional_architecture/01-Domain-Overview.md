# Domain Overview — Welpco Functional Architecture v2

> **Last Updated**: April 2026
> **Architecture**: Single NestJS backend (BFF) + Next.js 16 consumer web + Next.js 16 staff admin (`@welpco/admin`). **Deployment target:** consumer web and admin on **Vercel**; BFF is a long-lived Node service (not Vercel serverless) with PostgreSQL.

## Executive Summary

Welpco is a community services marketplace connecting customers with local service providers ("Welpers"). The platform is organized into **14 functional domains** following Domain-Driven Design principles. All domain logic runs inside a single NestJS backend as in-process modules — there are no separate microservice processes.

## Implementation Status

| Status | Meaning |
|--------|---------|
| **Implemented** | Live in the BFF, tested, and used by the web app |
| **Scaffolded** | Entity/module exists but only basic CRUD; needs full business logic |
| **Planned** | Designed in this architecture; not yet coded |

## Domain Map (14 domains)

### Core Transaction Domains

| # | Domain | Status | Description |
|---|--------|--------|-------------|
| 1 | Service Discovery & Search | **Implemented** | Full-text + pg_trgm search, location-based filtering, category browsing |
| 2 | Job Posting & Matching | Planned | Job creation, Welper applications, customer selection |
| 3 | Booking & Scheduling | **Implemented (core)** | Acceptance/decline, check-in/out, service receipt, cancellation, payment hooks; recurring bookings & automated reminders still TBD |
| 4 | Payment Processing | **Partial (MVP)** | Platform Stripe: save card, manual capture, delayed capture, webhooks; **manual Welper payouts** (no Connect); Connect/promo/invoicing future |

### User & Profile Domains

| # | Domain | Status | Description |
|---|--------|--------|-------------|
| 5 | User Management & Auth | **Implemented** | Email/password + JWT (access/refresh), email verification, referrals, lockout, CASL; **no social OAuth** in current product scope |
| 6 | Profile Management | **Implemented** | Customer/Welper profiles, service offerings, availability, favorites |
| 7 | Communication | **Partial** | Booking-scoped threads/messages over REST + inbox; WebSocket/real-time, attachments, support forms TBD |
| 8 | Review & Rating | **Partial** | Reviews after completed/payment_released; welper aggregate rating; moderation/replies/analytics TBD |

### Supporting Domains

| # | Domain | Status | Description |
|---|--------|--------|-------------|
| 9 | Safety & Verification | Planned | Background checks, identity/age verification, guardian verification |
| 10 | Dispute Resolution | **Partial** | BFF + admin resolution flow, booking state sync, refunds where applicable; full SLA/templates TBD |
| 11 | Notification | **Partial** | Transactional **email** for booking lifecycle (SMTP / dev Mailhog); SMS, push, preference center, templates product TBD |
| 12 | Content Management | **Implemented** | Categories, question library, static content, holidays |

### AI & Intelligence Domains (New)

| # | Domain | Status | Description |
|---|--------|--------|-------------|
| 13 | AI Conversational Experience | Planned | Generative UI chatbot, voice interaction, Vercel AI SDK |
| 14 | AI/ML Intelligence Platform | Planned | Smart matching, demand forecasting, pricing, anomaly detection |

## Primary Transaction Flow

```
Registration → Profile Setup → Search/Browse → (Job Post OR Direct Book)
    → Booking Confirmation → Payment Hold → Service Execution
    → Check-out → Payment Release → Review/Rating
```

## AI-Augmented Flows (New)

```
Customer opens Chat → AI understands intent via voice/text
    → AI shows generative UI (service cards, calendar picker, map)
    → Customer confirms → Booking created automatically

ML pipeline observes bookings → Predicts demand → Suggests optimal pricing
    → Ranks search results → Detects fraud → Improves over time
```

## Architecture Principles

1. **Single Backend**: All domains are NestJS modules in one app; in-process calls only
2. **Domain Boundaries as Code**: Each domain has its own module directory with clear exports
3. **Single Database**: One PostgreSQL instance; domains share the database with separate tables
4. **Synchronous Communication**: No message queues; domain-to-domain calls are method invocations
5. **Can Evolve**: Domain modules can be extracted to microservices later if scale demands it
6. **AI-First Design**: New features leverage AI/ML natively rather than bolting it on after

## Document Index

| Document | Description |
|----------|-------------|
| `02-Domain-Catalog.md` | Detailed catalog of all 14 domains |
| `03-Domain-Details/` | Individual domain specifications |
| `04-Domain-Dependencies.md` | Dependency matrix and integration patterns |
| `05-Backend-Technical-Architecture.md` | Technology stack and infrastructure decisions |
| `06-Client-Applications-Architecture.md` | Web app technology decisions |
