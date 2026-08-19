# Safety Verification Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/safety-verification/`

## Purpose
Optional adult Welper background checks — Stripe-paid checkout, Certn invite/webhook lifecycle, verified-badge status, and pricing — plus guardian-consent flows for minor Welpers (who do not take the check; see `background-check-age.util.ts`). Check approval does not gate profile activation, default search visibility, or bookings.

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `BackgroundCheckOrder` | `background_check_orders` | userId (unique), stripeCheckoutSessionId (unique), stripePaymentIntentId, amountCents, listAmountCents, currency (CAD), paymentStatus, certnApplicationId, certnStatus, certnApplicantUrl, failureReason, paidAt/submittedAt/completedAt/expiresAt | `BackgroundCheckPaymentStatus`: pending, paid, failed, refunded · `BackgroundCheckCertnStatus`: not_started, invited, in_progress, passed, failed |
| `MinorGuardianConsent` | `minor_guardian_consents` | minorUserId (unique), guardianFullName/Email/Phone, relationshipType, status, tokenHash, tokenExpiresAt, consentedAt, revokedAt, ipAddress, userAgent | `RelationshipType`: Parent, Legal Guardian · `GuardianConsentStatus`: pending, approved, declined, expired |

Also writes `VerificationStatus.backgroundCheckStatus` (user-management entity).

## Services

- `BackgroundCheckService` (`background-check.service.ts`) — status/eligibility API used across domains (`isBackgroundCheckRequiredForUser`, non-blocking booking hook, `hasPassedBackgroundCheck`, batch lookups), Certn invite submission/retry, webhook handling, `onPaymentSucceeded`.
- `BackgroundCheckPaymentService` (`background-check-payment.service.ts`) — Stripe Checkout session creation (via `payment/stripe-client`), `handleCheckoutSessionCompleted`, return-confirmation reconciliation.
- `BackgroundCheckPricingService` — pricing from `ApplicationSetting` (payment domain entity; seeded at $19.99 CAD per migration `20260518120001`).
- `GuardianConsentService` (`guardian-consent.service.ts`) — minor detection, consent request/resend, token-hashed public approve/decline/revoke with expiry and rate limiting.
- `CertnApiClient` (`certn-api.client.ts`) — Certn HR invite API; returns a deterministic fake when `CERTN_API_KEY` is unset (local dev).

## API endpoints (prefix `api`)

| Method | Path | Auth |
|---|---|---|
| GET | /api/verification/background-check/pricing | Public |
| GET | /api/verification/background-check/status | JwtAuthGuard + Roles(welper) |
| POST | /api/verification/background-check/checkout-session | JwtAuthGuard + Roles(welper) |
| POST | /api/verification/background-check/confirm-return | JwtAuthGuard + Roles(welper) |
| POST | /api/verification/background-check/retry-invite | JwtAuthGuard + Roles(welper) |
| POST | /api/verification/background-check/resend-invite-email | JwtAuthGuard + Roles(welper) |
| GET | /api/verification/guardian/status · POST /request · POST /resend | JwtAuthGuard (minor welper) |
| GET | /api/verification/guardian/review · POST /approve · /decline · /revoke | Public, token-based (emailed link) |
| POST | /api/webhooks/certn | Public; HMAC-SHA256 signature check when `CERTN_WEBHOOK_SECRET` set (accepts unsigned with a warning otherwise — `certn-webhook.controller.ts:44`) |

## Scheduled jobs
None (token/order expiry evaluated lazily).

## External integrations
- **Certn** — `https://api.certn.co` (prod) / `https://demo-api.certn.co` (dev), HR invite endpoint `/hr/v1/applications/invite/`; webhook receiver above.
- **Stripe** — Checkout sessions for the background-check fee (client from payment domain).
- Email via user-management `EmailModule` (invites, guardian review links).

## Cross-domain dependencies
Imports entities from payment (`ApplicationSetting`), user-management (`UserAccount`, `VerificationStatus`), profile-management (`WelperProfile`); modules: user-management email/cache/auth. Exported services are consumed by service-discovery, job-posting, booking, and the signup orchestrator.

## Key files
- `safety-verification.module.ts`, `background-check.service.ts`, `background-check-payment.service.ts`
- `certn-api.client.ts`, `certn-webhook.controller.ts`
- `guardian-consent.service.ts`, `guardian-consent.controller.ts`, `verification.controller.ts`
