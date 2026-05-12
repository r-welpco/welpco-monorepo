# Payment Processing Domain

> **Status**: Partially implemented (platform Stripe, no Connect)
> **Classification**: Core
> **Priority**: Critical
> **Module**: `welpco-monorepo/apps/bff/src/domains/payment/`

## Implemented (MVP — platform account, no Connect)

Welpco uses a **single Stripe platform account** (no Connect). Card data stays with Stripe; Welpco stores Stripe customer and payment-method IDs on `user_accounts`, and booking-level payment state on `booking_payments`.

- **Customer payment method**: `SetupIntent` + Elements (dashboard **Settings → Payment**). `profileCompletionStatus` **Complete** for customers requires a default payment method as well as name, phone, and address. **Onboarding does not collect a card.**
- **Booking create**: customers must have a default payment method (`POST /bookings` returns `400` with code `PAYMENT_METHOD_REQUIRED` if not).
- **Authorize after accept**: when the welper accepts, the customer calls `POST /bookings/:id/payment-intent` to create/confirm a **manual capture** `PaymentIntent` on the saved card (`off_session` when possible; `confirmCardPayment` if SCA is required).
- **Delayed capture**: when the welper checks out (`completed`), `capture_eligible_at` is set using `application_settings.payment_capture_delay_minutes` (seed default **30**). A scheduled job captures eligible intents while the booking is still **`completed`** (disputed bookings are excluded). Capture uses DB row locks to avoid double capture across BFF replicas. On success, the booking moves to **`payment_released`**.
- **Webhooks**: raw-body route verifies signatures and **awaits** handler completion for `setup_intent.succeeded` and `payment_intent.*` so failures return **5xx** and Stripe retries. Syncs `booking_payments`, default PM, and post-capture booking status.
- **Idempotency**: PaymentIntent create uses Stripe idempotency keys per booking; prior open intents are best-effort canceled when superseded.
- **Disputes**: resolving with refund / partial refund triggers a best-effort Stripe refund against the captured payment.
- **Admin export**: `GET /api/admin/payments/export` (CSV or `?format=json`) for captured rows; optional filters `welperId`, `dateFrom`, `dateTo` (for Desjardins-style reconciliation). Optional `PUT /api/admin/settings/payment_capture_delay_minutes` updates the delay.

Environment: BFF `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; web `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

## Purpose (full product vision)

The sections below describe the **longer-term** marketplace model (Connect, escrow to welpers, promos, invoices). They are **not** all implemented in the current codebase.

## Core Capabilities

### 1. Stripe Connect Marketplace

- **Platform account**: Welpco's Stripe account receives all customer payments
- **Connected accounts**: each Welper onboards to Stripe Connect (Standard or Express) to receive payouts
- **Payment flow**: Customer → Stripe (Welpco platform) → hold in escrow → release to Welper's connected account minus platform fee

### 2. Escrow Flow

```
┌─────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Booking      │     │ Stripe        │     │ Welpco Platform  │
│ Confirmed    │────▶│ PaymentIntent │────▶│ Funds Held       │
│              │     │ (authorize)   │     │ (escrow)         │
└─────────────┘     └───────────────┘     └────────┬─────────┘
                                                    │
                               Service completed    │
                               + 24h dispute window │
                                                    ▼
                                          ┌──────────────────┐
                                          │ Transfer to       │
                                          │ Welper's Connected│
                                          │ Account           │
                                          │ (minus platform %)│
                                          └──────────────────┘
```

1. **Authorize**: when Welper accepts booking, create a Stripe `PaymentIntent` with `capture_method: 'manual'`
2. **Capture**: when booking status moves to `Confirmed` (auth succeeded), capture the funds
3. **Hold**: funds sit in Welpco's Stripe balance during service execution
4. **Release**: 24h after service completion (or after dispute window), create a Stripe `Transfer` to the Welper's connected account

### 3. Platform Fee Structure

| Fee Type | Rate | Description |
|---|---|---|
| Service fee (customer-facing) | 10% of booking total | Added on top of Welper's rate |
| Platform commission (Welper-facing) | 5% of booking total | Deducted from Welper's payout |
| **Effective platform take** | **~15%** | Combined revenue per transaction |

- Fees are calculated at booking confirmation time and stored on the booking entity
- Fee rates are configurable via environment variables (`PLATFORM_FEE_CUSTOMER_PCT`, `PLATFORM_FEE_WELPER_PCT`)

### 4. Refund Scenarios

| Scenario | Refund Amount | Source |
|---|---|---|
| Customer cancels > 24h before service | 100% | Reverse the PaymentIntent |
| Customer cancels 2-24h before service | 50% (50% to Welper as cancellation fee) | Partial reversal + partial transfer |
| Customer cancels < 2h before service | 0% | No refund |
| Welper cancels (any time) | 100% to customer | Full reversal |
| Welper no-show | 100% to customer | Full reversal |
| Dispute — full refund | 100% to customer | Reversal from held funds |
| Dispute — partial refund | Admin-determined % | Partial reversal |

### 5. Promo Codes

| Field | Description |
|---|---|
| Code type | `fixed` (e.g., $10 off) or `percentage` (e.g., 15% off) |
| Scope | `all_services`, `specific_category`, `first_booking_only`, `referral` |
| Limits | Total uses, per-user limit, min booking amount, max discount cap |
| Validity | Start date, end date |
| Stacking | Not allowed — one promo code per booking |

Promo code validation flow:
1. Customer enters code during booking checkout
2. Server validates: code exists, is active, within date range, not exceeded limits, meets min amount
3. Discount is applied to `finalAmount` on the booking
4. Usage is recorded for tracking

### 6. Payout Schedule

- **Weekly payouts**: every Monday, Stripe transfers accumulated earnings to Welper's connected bank account
- Welpers can also trigger on-demand payouts (minimum $25)
- Payout includes: service earnings minus platform commission
- Dashboard shows: pending balance, next payout date, payout history

### 7. Webhook Handling

Stripe events are received via webhook and processed asynchronously:

| Stripe Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark payment as captured, confirm booking |
| `payment_intent.payment_failed` | Mark booking as payment failed, notify customer |
| `charge.refunded` | Update refund status |
| `transfer.created` | Record payout to Welper |
| `account.updated` | Update Welper's Stripe account status |
| `charge.dispute.created` | Auto-create dispute in Dispute Resolution domain |

## Data Entities

### PaymentTransaction

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `transactionType` | `enum` | `Authorization`, `Capture`, `Release`, `Refund` |
| `amount` | `decimal(10,2)` | Not null |
| `platformFee` | `decimal(10,2)` | |
| `currency` | `varchar(3)` | Default `CAD` |
| `status` | `enum` | `Pending`, `Succeeded`, `Failed`, `Refunded` |
| `stripePaymentIntentId` | `varchar(255)` | Stripe PI ID |
| `stripeTransferId` | `varchar(255)` | For payouts |
| `stripeChargeId` | `varchar(255)` | |
| `metadata` | `jsonb` | Additional Stripe metadata |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### WelperPayoutAccount

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `welperId` | `uuid` | FK → `UserAccount.id`, unique |
| `stripeConnectedAccountId` | `varchar(255)` | Stripe account ID |
| `accountStatus` | `enum` | `Pending`, `Active`, `Restricted`, `Disabled` |
| `payoutsEnabled` | `boolean` | Default `false` |
| `onboardingCompleted` | `boolean` | Default `false` |
| `defaultCurrency` | `varchar(3)` | Default `CAD` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### Refund

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `paymentTransactionId` | `uuid` | FK → `PaymentTransaction.id` |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `amount` | `decimal(10,2)` | Not null |
| `reason` | `enum` | `CustomerCancellation`, `WelperCancellation`, `NoShow`, `DisputeFull`, `DisputePartial` |
| `status` | `enum` | `Pending`, `Processing`, `Completed`, `Failed` |
| `stripeRefundId` | `varchar(255)` | |
| `disputeId` | `uuid` | FK → `Dispute.id`, nullable |
| `createdAt` | `timestamptz` | Auto |

### PromoCode

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `code` | `varchar(50)` | Unique, uppercase |
| `codeType` | `enum` | `Fixed`, `Percentage` |
| `discountValue` | `decimal(10,2)` | Amount or percentage |
| `scope` | `enum` | `AllServices`, `SpecificCategory`, `FirstBooking`, `Referral` |
| `scopeCategoryId` | `uuid` | FK → `ServiceCategory.id`, nullable |
| `minBookingAmount` | `decimal(10,2)` | Nullable |
| `maxDiscountAmount` | `decimal(10,2)` | Nullable (cap for percentage codes) |
| `totalUsageLimit` | `integer` | Nullable |
| `perUserLimit` | `integer` | Default `1` |
| `currentUsageCount` | `integer` | Default `0` |
| `validFrom` | `timestamptz` | Not null |
| `validTo` | `timestamptz` | Not null |
| `isActive` | `boolean` | Default `true` |
| `createdBy` | `uuid` | FK → `UserAccount.id` (admin) |
| `createdAt` | `timestamptz` | Auto |

### PromoCodeUsage

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `promoCodeId` | `uuid` | FK → `PromoCode.id` |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `discountApplied` | `decimal(10,2)` | |
| `createdAt` | `timestamptz` | Auto |

### Invoice

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `subtotal` | `decimal(10,2)` | Service cost |
| `serviceFee` | `decimal(10,2)` | Customer-facing fee |
| `discount` | `decimal(10,2)` | Promo code discount |
| `total` | `decimal(10,2)` | Final charge |
| `status` | `enum` | `Draft`, `Issued`, `Paid`, `Adjusted`, `Cancelled` |
| `issuedAt` | `timestamptz` | |
| `paidAt` | `timestamptz` | |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/payments`.

### Payment Operations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/create-intent` | Internal | Create PaymentIntent for a booking (called by Booking domain). |
| `POST` | `/payments/capture/:bookingId` | Internal | Capture authorized payment. |
| `POST` | `/payments/release/:bookingId` | Internal | Release funds to Welper. |
| `POST` | `/payments/refund` | Admin/Internal | Initiate a refund. Body: `{ bookingId, amount, reason }`. |
| `GET` | `/payments/transactions` | Bearer | List transactions for current user. |
| `GET` | `/payments/transactions/:id` | Bearer | Get transaction details. |

### Welper Stripe Onboarding

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/connect/onboard` | Bearer (Welper) | Start Stripe Connect onboarding. Returns redirect URL. |
| `GET` | `/payments/connect/status` | Bearer (Welper) | Check connected account status. |
| `GET` | `/payments/connect/dashboard` | Bearer (Welper) | Get Stripe Express dashboard link. |

### Promo Codes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/promo-codes/validate` | Bearer | Validate a promo code for a booking. Body: `{ code, bookingAmount, categoryId? }`. |
| `POST` | `/payments/promo-codes` | Admin | Create a promo code. |
| `GET` | `/payments/promo-codes` | Admin | List all promo codes. |
| `PATCH` | `/payments/promo-codes/:id` | Admin | Update a promo code (deactivate, extend). |

### Invoices & Receipts

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/payments/invoices/:bookingId` | Bearer | Get invoice for a booking. |
| `GET` | `/payments/receipts/:bookingId` | Bearer | Get receipt after payment. |

### Webhook

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/webhooks/stripe` | Stripe signature | Stripe webhook endpoint. Validates `stripe-signature` header. |

## Business Rules

1. **No card data stored**: all payment methods are managed by Stripe. Welpco only stores Stripe customer IDs and PaymentIntent IDs.
2. **Authorization before confirmation**: payment is authorized (not captured) when Welper accepts. Capture happens when booking is confirmed.
3. **24-hour dispute window**: funds are held for 24 hours after service completion. If no dispute is filed, auto-release begins.
4. **Platform fee is non-refundable**: when issuing a full refund to the customer, the platform fee portion is absorbed by Welpco.
5. **One promo code per booking**: stacking is not allowed.
6. **Welper must complete Stripe onboarding**: payouts are disabled until the Welper's connected account is fully verified by Stripe.
7. **Minimum payout**: $25 CAD for on-demand payouts. Weekly automatic payouts have no minimum.
8. **Currency**: all transactions are in CAD (Canadian dollars). Multi-currency support is a future consideration.
9. **Webhook idempotency**: all webhook handlers use Stripe event IDs for idempotency to prevent duplicate processing.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | Booking & Scheduling | Booking events trigger authorization, capture, and release |
| **Depends on** | Dispute Resolution | Dispute resolution triggers refunds |
| **Depends on** | User Management | Referral completion triggers referral reward credits |
| **Consumed by** | Booking & Scheduling | Payment status affects booking state transitions |
| **Consumed by** | Notification | Payment events trigger email/SMS notifications |

## Security Considerations

- **PCI compliance**: no card numbers, CVVs, or sensitive payment data touch Welpco servers. Stripe.js and Stripe Elements handle all card input on the frontend.
- **Webhook verification**: all incoming Stripe webhooks are verified using the `stripe-signature` header and the webhook signing secret.
- **Stripe API keys**: stored as environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`). Never committed to source control.
- **Connected account isolation**: Welpers cannot access other Welpers' payment data. Each Welper only sees their own transactions and payouts.
- **Idempotency keys**: all payment operations use idempotency keys to prevent double charges.

## Implementation Plan

### Phase 1 — Core Payment Flow (Sprint 1-2)
1. Set up Stripe SDK and configuration module
2. Implement `PaymentModule` with PaymentIntent create/capture/release
3. Stripe webhook endpoint with signature verification
4. Integration with Booking domain for hold-on-accept flow

### Phase 2 — Welper Onboarding & Payouts (Sprint 3)
1. Stripe Connect onboarding flow (Express accounts)
2. Transfer creation on payment release
3. Payout tracking and dashboard link

### Phase 3 — Promo Codes & Invoicing (Sprint 4)
1. Promo code CRUD and validation
2. Invoice generation on booking confirmation
3. Receipt generation after payment

### Phase 4 — Refunds & Edge Cases (Sprint 5)
1. Refund processing (full and partial)
2. Cancellation fee calculation
3. Referral reward credit processing
