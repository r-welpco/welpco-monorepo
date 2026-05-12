# Safety & Verification Domain

> **Status**: Planned (full third-party verification) — **admin-only** Welper background-check status exists in BFF; no ID vendor integration yet
> **Classification**: Supporting
> **Priority**: High
> **Module**: `domains/safety/` (to be created)

## Purpose

Ensures platform safety through identity verification, background checks, age verification, and guardian consent for minors. Integrates with third-party verification providers (Certn or Sterling for the Canadian market) and provides a tiered verification badge system displayed on Welper profiles. Critical for building customer trust in the marketplace.

## Core Capabilities

### 1. Verification Tiers

| Tier | Requirements | Badge | Can Receive Bookings |
|---|---|---|---|
| **Basic** | Email verified | No badge | No |
| **Standard** | Email + identity verified (document + selfie) | Blue checkmark | Yes |
| **Premium** | Email + identity + background check passed | Gold checkmark | Yes (preferred in search) |

- All Welpers start at `Basic` tier after registration
- Tier is computed from the individual verification statuses
- Customers see the tier badge on search results and Welper profiles

### 2. Identity Verification

- **Document upload**: government-issued ID (driver's license, passport, or provincial ID card)
- **Selfie match**: user takes a live selfie that is compared against the document photo
- **Provider**: third-party API (Certn or Sterling) performs the document + biometric match
- **Flow**: user uploads documents via the app → backend sends to verification provider → provider processes asynchronously → webhook callback updates status

### 3. Background Check

- **Scope**: criminal record check (Canadian Police Information Centre) + identity confirmation
- **Provider**: Certn (primary) or Sterling (fallback), both specializing in Canadian background checks
- **Eligibility**: required for adult Welpers (18+). Minors (14-17) are exempt.
- **Processing time**: typically 1-5 business days
- **Annual renewal**: background checks expire after **12 months**. Welpers are notified 30 days before expiration.
- **Result handling**: pass/fail only. Detailed results are not stored on Welpco — only the status and completion date.

### 4. Age Verification

- Date of birth is collected during registration
- Age determines:
  - 18+: must complete background check
  - 14-17: exempt from background check, requires guardian account
  - <14: registration rejected
- Age is verified against the identity document during identity verification

### 5. Guardian Consent for Minors

- Minors (14-17) must have a linked guardian account (created in User Management domain)
- Guardian must provide digital consent for the minor to operate as a Welper
- Guardian consent is stored as a signed record with timestamp
- Guardian verification: the guardian's own identity must be verified to `Standard` tier minimum

### 6. Verification Badge Display

- Badge is displayed on: search results, Welper profile page, booking confirmation screen
- Badge tooltip shows verification details (e.g., "Identity verified", "Background check passed Dec 2025")
- Expired verifications: badge is downgraded and the Welper receives a renewal notification

## Data Entities

### IdentityVerification

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `documentType` | `enum` | `DriversLicense`, `Passport`, `ProvincialID` |
| `documentCountry` | `varchar(2)` | ISO 3166-1 alpha-2 (e.g., `CA`) |
| `status` | `enum` | `Pending`, `Processing`, `Verified`, `Failed`, `Expired` |
| `providerName` | `varchar(50)` | e.g., `certn`, `sterling` |
| `providerReferenceId` | `varchar(255)` | External ID for tracking |
| `selfieMatchScore` | `decimal(5,2)` | 0-100 confidence score, nullable |
| `verifiedAt` | `timestamptz` | Nullable |
| `expiresAt` | `timestamptz` | Nullable (identity verifications typically don't expire) |
| `failureReason` | `text` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### BackgroundCheck

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `checkType` | `enum` | `Criminal`, `CriminalAndIdentity` |
| `status` | `enum` | `Pending`, `Processing`, `Passed`, `Failed`, `Expired` |
| `providerName` | `varchar(50)` | `certn` or `sterling` |
| `providerReferenceId` | `varchar(255)` | External ID |
| `initiatedAt` | `timestamptz` | Not null |
| `completedAt` | `timestamptz` | Nullable |
| `expiresAt` | `timestamptz` | `completedAt + 12 months` |
| `renewalNotifiedAt` | `timestamptz` | Nullable (30 days before expiry) |
| `failureReason` | `text` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### AgeVerification

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, unique |
| `dateOfBirth` | `date` | Not null |
| `ageAtRegistration` | `integer` | Computed |
| `isMinor` | `boolean` | `true` if 14-17 at registration |
| `verificationMethod` | `enum` | `SelfDeclaration`, `DocumentVerified` |
| `verifiedAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### GuardianConsent

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `guardianUserId` | `uuid` | FK → `UserAccount.id` |
| `minorUserId` | `uuid` | FK → `UserAccount.id` |
| `consentType` | `enum` | `WelperAccountCreation`, `BackgroundCheckWaiver` |
| `consentText` | `text` | Legal text the guardian agreed to |
| `ipAddress` | `varchar(45)` | Recorded at consent time |
| `userAgent` | `varchar(500)` | Recorded at consent time |
| `consentedAt` | `timestamptz` | Not null |

### VerificationSummary

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, unique |
| `tier` | `enum` | `Basic`, `Standard`, `Premium` |
| `emailVerified` | `boolean` | From User Management |
| `identityVerified` | `boolean` | |
| `backgroundCheckPassed` | `boolean` | |
| `backgroundCheckExpiresAt` | `timestamptz` | Nullable |
| `isMinor` | `boolean` | |
| `hasGuardianConsent` | `boolean` | |
| `lastUpdatedAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/verification`.

### User Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/verification/status` | Bearer | Get current user's verification summary (tier, statuses). |
| `POST` | `/verification/identity/start` | Bearer (Welper) | Initiate identity verification. Returns provider redirect URL. |
| `POST` | `/verification/background-check/start` | Bearer (Welper, 18+) | Initiate background check. Returns provider redirect URL. |
| `GET` | `/verification/identity/:id` | Bearer | Check identity verification status. |
| `GET` | `/verification/background-check/:id` | Bearer | Check background check status. |

### Guardian Actions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/verification/guardian/consent` | Bearer (Guardian) | Record guardian consent for minor's account. |
| `GET` | `/verification/guardian/consent/:minorUserId` | Bearer (Guardian) | Check consent status. |

### Webhook (from provider)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/verification/webhooks/certn` | Certn signature | Receive identity/background check results. |
| `POST` | `/verification/webhooks/sterling` | Sterling signature | Receive identity/background check results. |

### Public (consumed by other domains)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/verification/users/:userId/badge` | Internal | Get verification tier for display (used by Profile and Search). |

## Business Rules

1. **Adult Welpers must reach Standard tier** (identity verified) before receiving their first booking. Premium tier (background check) is strongly encouraged and affects search ranking.
2. **Minors are exempt from background checks** but require guardian consent and guardian identity verification.
3. **Background check renewal**: expires 12 months after completion. Welper is notified at 30 days, 7 days, and 1 day before expiry. Expired checks downgrade the tier from Premium to Standard.
4. **Failed identity verification**: user can retry up to 3 times. After 3 failures, manual review by admin is required.
5. **Failed background check**: account is not activated for bookings. User is notified with instructions to contact support.
6. **No detailed results stored**: Welpco only stores pass/fail status and the provider reference ID. No criminal record details are stored on our servers.
7. **Guardian must be Standard-verified**: a guardian cannot consent for a minor until their own identity is verified.
8. **Verification badge is real-time**: tier is recomputed whenever any verification status changes (via `VerificationSummary` recalculation).

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | User Management | User account and age data |
| **Depends on** | External: Certn/Sterling | Background check and identity verification APIs |
| **Consumed by** | Profile Management | Verification badge on Welper profiles |
| **Consumed by** | Service Discovery | Tier-based search filtering and ranking boost |
| **Consumed by** | Booking & Scheduling | Minimum tier check before booking acceptance |
| **Consumed by** | Notification | Renewal reminders and verification status notifications |

## Security Considerations

- **No PII storage from verification provider**: only pass/fail status and reference IDs are stored. Document images and biometric data are handled entirely by the provider.
- **Webhook signature verification**: all incoming webhooks from Certn/Sterling are verified using HMAC signatures.
- **Guardian consent audit trail**: IP address, user agent, and consent text are recorded for legal compliance.
- **Encryption**: verification reference IDs and provider API keys are stored encrypted.
- **Access control**: only the user themselves and admin staff can view verification details. Other users see only the tier badge.

## Implementation Plan

### Phase 1 — Identity Verification (Sprint 1-2)
1. Create `SafetyModule` with entities and migrations
2. Integrate with Certn API for identity verification (document + selfie)
3. Webhook endpoint for async results
4. Verification summary computation and tier assignment
5. Badge display API for Profile and Search domains

### Phase 2 — Background Checks (Sprint 3)
1. Background check initiation for 18+ Welpers
2. Webhook processing for background check results
3. Expiration tracking and renewal notifications (NestJS `@Cron`)
4. Tier downgrade on expiration

### Phase 3 — Guardian & Minor Flow (Sprint 4)
1. Guardian consent recording with audit trail
2. Minor age verification against identity document
3. Guardian verification requirement enforcement
4. Admin dashboard for verification management and manual review
