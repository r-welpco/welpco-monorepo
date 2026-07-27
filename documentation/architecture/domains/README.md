# BFF Domain Modules

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

All 13 domain modules under `apps/bff/src/domains/`. See [../backend-overview.md](../backend-overview.md) for how they are wired together.

| Domain | Purpose | Doc |
|---|---|---|
| booking | Booking request lifecycle (pending → accepted → in progress → completed → payment released), service receipts, cancellation policy | [booking.md](booking.md) |
| communication | Chat threads and messages between customers and welpers | [communication.md](communication.md) |
| content-management | Service category taxonomy, service questions, static content, FAQ, holidays, marketing phrases | [content-management.md](content-management.md) |
| dispute | Problem reports (disputes) on bookings, admin resolutions with refunds, support tickets | [dispute.md](dispute.md) |
| geocode | Address geocoding lookups | [geocode.md](geocode.md) |
| job-posting | Customer job postings and welper applications | [job-posting.md](job-posting.md) |
| notification | In-app notifications, notification preferences, localized email dispatch | [notification.md](notification.md) |
| payment | Stripe card holds/captures, taxes, refunds, welper payout ledger and Monday payout batches via Stripe Connect | [payment.md](payment.md) |
| profile-management | Customer and welper profiles, service offerings, availability calendars/exceptions, favorites | [profile-management.md](profile-management.md) |
| review | Post-booking reviews (customer ↔ welper) and welper rating aggregates | [review.md](review.md) |
| safety-verification | Background check orders (Stripe checkout paid), minor guardian consent | [safety-verification.md](safety-verification.md) |
| service-discovery | Welper/service search and discovery results | [service-discovery.md](service-discovery.md) |
| user-management | User accounts, authentication, email verification, referrals, admin console endpoints and audit log | [user-management.md](user-management.md) |
