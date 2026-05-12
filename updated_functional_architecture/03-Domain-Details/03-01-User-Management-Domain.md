# User Management & Authentication Domain

> **Status**: Implemented (email/password + JWT; **no social OAuth** in current web/admin — Auth.js v5 credentials provider → BFF)
> **Classification**: Core
> **Priority**: Critical
> **Module**: `domains/user-management/`

## Purpose

Manages the complete user account lifecycle: registration, authentication, email verification, password management, account lockout, authorization (CASL), referral tracking, and guardian accounts for minors. This domain is the foundation that every other domain depends on for authenticated user context.

## Core Capabilities

### 1. Registration

- **Customer registration**: email, password, first name, last name, optional referral code
- **Welper registration**: same fields plus account type designation
- Accounts are created with `Pending` status; transition to `Active` after email verification
- Profile creation in the Profile Management domain is triggered automatically after account creation
- Guardian accounts can be linked to minor (14-17) Welper accounts

### 2. JWT Authentication

- **Access token**: short-lived (configurable via `JWT_EXPIRATION`, default `3600s`)
- **Refresh token**: longer-lived, stored in the database, rotated on each use
- Token payload: `{ sub: userId, email, roles }`
- Passport.js JWT strategy (`@nestjs/passport`)
- Controllers access the current user via the **`@CurrentUser()` parameter decorator** — manual `req.headers.authorization` parsing is never used

### 3. Email Verification

- Crypto-secure **6-digit numeric code** generated on registration
- Code is sent immediately (no async event bus dependency)
- Codes have a configurable TTL (default 15 minutes)
- Unverified accounts have restricted access until email is confirmed

### 4. Password Reset

- Request sends a reset token to the user's email
- Token-based reset flow (crypto-random token, time-limited)
- New password must meet complexity requirements

### 5. Account Lockout

- **5 consecutive failed login attempts** lock the account for **15 minutes**
- Lockout is keyed on **email-normalized** value (case-insensitive, trimmed)
- Failed attempt counter resets on successful login
- Lockout timestamp is stored on the user entity

### 6. Authorization (CASL)

- Role-based permissions defined via CASL ability factories
- Roles: `Customer`, `Welper`, `Guardian`, `Admin`
- `@CheckPolicies()` decorator + `PoliciesGuard` enforce handler-level authorization
- Abilities are rebuilt on each request from the authenticated user's roles

### 7. Referral System

- Every user gets a unique referral code on account creation
- New users can supply a referral code during registration
- Referral status: `Pending` → `Completed` (first booking by referee) → `Rewarded`
- Self-referrals are prevented (code cannot be used by its owner)
- Referral analytics: codes generated, referrals made, completions, rewards earned

### 8. Guardian Accounts

- A guardian (parent/legal guardian) creates a standard account, then links it to a minor's Welper account
- Guardian relationship is stored in the `GuardianAccount` entity
- Guardians manage the minor's profile, bookings, and communication
- Minors aged 14-17 are exempt from background checks

## Data Entities

### UserAccount

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, auto-generated |
| `email` | `varchar(255)` | Unique, not null, normalized (lowercased, trimmed) |
| `passwordHash` | `varchar(255)` | Not null, bcrypt (12 rounds) |
| `firstName` | `varchar(100)` | Not null |
| `lastName` | `varchar(100)` | Not null |
| `accountType` | `enum` | `Customer`, `Welper`, `Guardian` |
| `accountStatus` | `enum` | `Pending`, `Active`, `Suspended`, `Deactivated` |
| `emailVerified` | `boolean` | Default `false` |
| `failedLoginAttempts` | `integer` | Default `0` |
| `lockoutUntil` | `timestamptz` | Nullable |
| `lastLoginAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### GuardianAccount

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `guardianUserId` | `uuid` | FK → `UserAccount.id`, not null |
| `minorUserId` | `uuid` | FK → `UserAccount.id`, not null |
| `relationshipType` | `varchar(50)` | e.g., `parent`, `legal_guardian` |
| `createdAt` | `timestamptz` | Auto |

### EmailVerificationToken

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, not null |
| `code` | `varchar(6)` | Crypto-random 6-digit code |
| `expiresAt` | `timestamptz` | Not null |
| `usedAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### ReferralCode

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id`, unique |
| `code` | `varchar(20)` | Unique, alphanumeric |
| `codeType` | `enum` | `Personal`, `Campaign` |
| `isActive` | `boolean` | Default `true` |
| `expiresAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### Referral

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `referrerUserId` | `uuid` | FK → `UserAccount.id` |
| `refereeUserId` | `uuid` | FK → `UserAccount.id` |
| `referralCodeId` | `uuid` | FK → `ReferralCode.id` |
| `status` | `enum` | `Pending`, `Completed`, `Rewarded`, `Expired` |
| `completedAt` | `timestamptz` | When referee completes first booking |
| `rewardStatus` | `enum` | `Pending`, `Awarded`, `Expired` |
| `rewardAmount` | `decimal(10,2)` | Nullable |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register customer or Welper. Sends verification email immediately. |
| `POST` | `/auth/login` | Public | Authenticate. Returns `{ accessToken, refreshToken }`. Increments lockout counter on failure. |
| `POST` | `/auth/verify-email` | Public | Submit 6-digit code to verify email. |
| `POST` | `/auth/resend-verification` | Public | Resend verification code (rate-limited). |
| `POST` | `/auth/forgot-password` | Public | Send password reset email. |
| `POST` | `/auth/reset-password` | Public | Reset password using token from email. |
| `POST` | `/auth/refresh` | Bearer | Rotate refresh token, return new access + refresh tokens. |
| `POST` | `/auth/change-password` | Bearer | Change password (requires current password). |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Bearer | Get authenticated user's account (uses `@CurrentUser()`). |
| `PATCH` | `/users/me` | Bearer | Update own account fields (name, email). |
| `GET` | `/users` | Admin | Paginated list of all users. |
| `GET` | `/users/:id` | Admin | Get any user by ID. |

### Referrals — `/api/referrals`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/referrals/code` | Bearer | Get the current user's referral code. |
| `POST` | `/referrals/apply` | Public | Apply referral code during registration. |
| `GET` | `/referrals` | Bearer | List the current user's referral history. |
| `GET` | `/referrals/stats` | Bearer | Referral analytics (count, completed, rewarded). |

## Business Rules

1. **Email uniqueness**: enforced at the database level (unique index on normalized email). A user cannot hold both a Customer and Welper account with the same email — they register once and the account type is set.
2. **Password policy**: minimum 8 characters, at least one uppercase, one lowercase, one number.
3. **Lockout**: after 5 failed logins, account is locked for 15 minutes. Lock is checked before password comparison.
4. **Email verification**: must be completed before the user can create bookings or post jobs. Unverified users can browse and view profiles.
5. **Guardian flow**: guardian registers normally, then creates a linked minor account. The minor cannot register independently.
6. **Referral self-use prevention**: applying your own referral code returns a `400` error.
7. **Referral completion**: a referral transitions to `Completed` only when the referee's first booking is marked as service-completed (not just created).

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Provides** | All domains | Authenticated user context via JWT guard |
| **Provides** | Profile Management | User account for profile creation |
| **Consumes** | Booking & Scheduling | `ServiceCompleted` event to mark referral as completed |
| **Consumes** | Safety & Verification (future) | Verification status updates |

## Security Considerations

- **bcrypt** with **12 salt rounds** for password hashing
- `JWT_SECRET` is **required** — the application throws `ConfigurationError` on startup if missing or empty. There is no fallback default.
- **Helmet** middleware applies security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- `@nestjs/throttler` rate-limits auth endpoints (configurable via `THROTTLE_TTL` / `THROTTLE_LIMIT`)
- Refresh tokens are stored hashed in the database; compromised tokens can be revoked
- CORS configured with explicit origin allowlist (`CORS_ORIGINS` env var)

## Implementation Notes

- Auth controllers use `@CurrentUser()` decorator exclusively — never `req.user` or manual header parsing
- Registration sends the verification email synchronously within the same request (no Kafka, no event bus)
- The `UserManagementModule` exports `UserService` for other modules to resolve user entities by ID
- Database migrations manage schema changes; `synchronize: false` in all environments
- Session management is client-side (NextAuth.js on the frontend); the backend is stateless JWT only
