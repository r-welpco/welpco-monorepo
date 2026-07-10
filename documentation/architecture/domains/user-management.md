# User Management Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/user-management/`

## Purpose
Owns user accounts, authentication (JWT login/refresh, password reset, email verification, signup wizard orchestration), referrals, and the admin back office. Also hosts the shared `EmailService` used by other domains.

## Entities (`entities/`, `admin/admin-audit-log.entity.ts`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `UserAccount` | `user_accounts` | email (unique), passwordHash, accountType, status, emailVerified, authVersion, signupCompleted, platformAccessEnabled, preferredLocale, selectedRole, stripeCustomerId, status-change moderation columns | `AccountType`: Customer, Welper, Guardian, Admin · `AccountStatus`: Pending, Active, Suspended, Deactivated · `SelectedRole`: customer, welper |
| `VerificationStatus` | `verification_statuses` | userId (unique), emailVerified, backgroundCheckStatus, identityVerified, verificationDate | `BackgroundCheckStatus`: Not Required, Pending, In Progress, Passed, Failed, Expired |
| `EmailVerificationToken` | `email_verification_tokens` | userId, token (unique), expiresAt, usedAt | — |
| `ReferralCode` | `referral_codes` | userId, code (unique), codeType, isActive, expiresAt | `CodeType`: Personal, Campaign |
| `Referral` | `referrals` | referrerUserId, refereeUserId, referralCodeId, status, rewardStatus, rewardAmount | `ReferralStatus`: Pending, Completed, Rewarded, Expired · `RewardStatus`: Pending, Awarded, Expired |
| `AdminAuditLog` | `admin_audit_logs` | actorUserId, action, metadata (jsonb) | — |

## Services

- `AuthService` (`auth/auth.service.ts`) — register/login/refresh/logout, JWT issuance, authVersion invalidation.
- `SignupOrchestratorService` (`auth/signup-orchestrator.service.ts`) — multi-step signup wizard state machine (begin, select-role, identity, welper bio/service-area/offering/availability/background-check/payout, notification-prefs, optional-profile, finish); computes welper discoverability.
- `EmailVerificationService`, `PasswordResetService`, `AccountLockoutService` — token flows and failed-login lockout.
- `UsersService` (`users/users.service.ts`) — account CRUD, status updates, deletion.
- `ReferralService` (`referral/referral.service.ts`) — code generation, apply, history, stats.
- `AdminService`, `AdminDashboardService`, `AdminAuditService` (`admin/`) — user moderation, platform stats, dashboard snapshot, audit trail.
- `EmailService` (`email/email.service.ts`) — wraps `@welpco/email`: Resend when `RESEND_API_KEY` is set, else SMTP/nodemailer (default localhost:1025). Exported and reused by notification, safety-verification, etc.
- `CacheService`/`MemoryCacheService` (`cache/`) — in-process cache (rate limits, lockouts).
- `EventPublisherService` (`events/event-publisher.service.ts`) — no-op stub (Kafka removed; user.created is handled synchronously via `ProfileCreationService`).

## API endpoints (global prefix `api`, `main.ts:79`)

Note: the HTTP facade `apps/bff/src/modules/auth/auth.controller.ts` also registers `@Controller('auth')` and is imported **before** this domain in `app.module.ts`, so it serves the overlapping routes plus the signup wizard (`POST /api/auth/signup/begin`, `GET /api/auth/signup/state`, `POST /api/auth/signup/step/*`, `POST /api/auth/signup/finish`). The domain controller below declares largely the same non-wizard routes.

| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register | Public + RateLimitGuard (5/h per IP) |
| POST | /api/auth/login | Public |
| POST | /api/auth/verify-email | Public + RateLimitGuard |
| POST | /api/auth/resend-verification | JwtAuthGuard |
| POST | /api/auth/reset-password, /reset-password/confirm | Public (+ rate limit) |
| POST | /api/auth/change-password | JwtAuthGuard |
| POST | /api/auth/refresh | Public |
| GET | /api/auth/session · POST /api/auth/logout | JwtAuthGuard |
| GET/PUT/DELETE | /api/users/me | JwtAuthGuard (PUT also EmailVerifiedGuard) |
| GET /api/users/:id · PUT /api/users/:id/status | JwtAuthGuard + RolesGuard(Admin) |
| GET | /api/referrals, /api/referrals/code, /api/referrals/stats · POST /api/referrals/apply | JwtAuthGuard |
| GET | /api/health | health controller (`health/health.controller.ts`; same path also exists in other domains) |

### Admin subdomain (`admin/admin.controller.ts`)
All routes under `/api/admin`, class-level `JwtAuthGuard + RolesGuard`, `@Roles(AccountType.ADMIN)`:
users list/detail/signup-state, `PUT users/:id/status`, `PUT users/:id/background-check`, `POST users/:id/unlock`, `GET users/:id/profile|offerings`, `PUT users/:id/profile-flags`, reviews list/delete, notifications, referrals (+stats), `POST bookings/:id/cancel`, `POST users` (create admin), stats, dashboard, bookings list/detail, jobs list/detail, support-tickets list/detail/patch, audit-logs, `GET reports/welper-distribution`, and settings `GET/PUT settings/payment_capture_delay_minutes`.

Payout endpoints (`GET payouts/upcoming|recoveries|tax-failures|batches|batches/:id|batches/:id/export`, `POST payouts/batches/build|batches/:id/approve|recoveries/:transferId/refresh|refresh-pending-fees|retry-tax`) delegate to `PayoutBatchService`/`StripeOperationsService` in the payment domain — see [payment.md](./payment.md).

## Scheduled jobs
None in this domain (no `@Cron`/`@Interval`).

## External integrations
- Resend (email API) via `@welpco/email` (`packages/email/src/resend.ts`), SMTP/nodemailer fallback.
- Stripe indirectly: `UserAccount.stripeCustomerId`; admin payout endpoints call payment-domain Stripe services.

## Cross-domain dependencies
Imports `ProfileManagementDomainModule` (module file). `AdminModule` imports payment (`PayoutBatchService`, `StripeOperationsService`, `ApplicationSettingsService`), booking (`BookingService`), dispute (`SupportTicketService`), and job-posting (`JobPostingService`). Conversely, its `EmailModule`, `CacheModule`, `AuthModule` and entities are consumed by notification, safety-verification, service-discovery, communication and job-posting.

## Key files
- `user-management.module.ts`, `auth/auth.controller.ts`, `auth/signup-orchestrator.service.ts`
- `admin/admin.controller.ts`, `admin/admin.service.ts`, `admin/admin-dashboard.service.ts`
- `entities/user-account.entity.ts`, `email/email.service.ts`
- Facade: `apps/bff/src/modules/auth/`, `apps/bff/src/modules/users/`
