**Welpco production-readiness audit — 5 September 2026**

**Assessment: do not approve a production release from this checkout yet.** Builds and types pass, but a fresh database cannot finish migrating, the background-check integration has several functional defects, and authentication and payment recovery have operational weaknesses.

Audited commit: `6827dc90a46b4db9b3c14c8dd81607891947b419`. Scope: customer web, admin, NestJS BFF, shared packages, migrations, dependency lockfile, and infrastructure/release definitions. Existing user changes were preserved. No production application data, deployments, payments, emails, or cloud settings were changed. Audit artifacts and normal local build outputs were generated.

This is a repository and isolated local execution audit. No production URL or hosting account was supplied; deployed configuration, actual bucket policies, backups, monitoring, IAM, and production behavior remain unverified. The findings below do not establish that production has been compromised. This review is not an exhaustive proof that every route, dependency, or business flow is safe.

**Verification results**

| Check | Result | Evidence |
|---|---|---|
| Workspace type checking | 15/15 Turbo tasks successful; includes prerequisite package builds, with 3 cached | `artifacts/production-audit-2026-09-05/type-check.log` |
| Workspace production build | 10/10 Turbo tasks successful, 7 cached | `artifacts/production-audit-2026-09-05/build.log` |
| Pinned Node 22.21.1 builds | Web, admin and BFF all pass, invoked with the absolute executable | `artifacts/production-audit-2026-09-05/web-build-node22.log`, `admin-build-node22.log`, `bff-build-node22.log` |
| Backend unit tests | 70 suites pass, 2 fail; 733 tests pass, 4 fail | `artifacts/production-audit-2026-09-05/bff-tests.log` |
| Lint without fixes | 0 errors, 1,436 warnings | `artifacts/production-audit-2026-09-05/lint.log` |
| Empty PostgreSQL migration | FAIL: 79 discovered, 76 recorded before failure | `artifacts/production-audit-2026-09-05/migrations.log` |
| Production dependency scan | Registry metadata: 3 critical, 53 high, 59 moderate, 7 low; 109 advisory records | `artifacts/production-audit-2026-09-05/dependency-audit.json` |
| Common secret formats in current tracked files | No matches in 2,589 text files | `artifacts/production-audit-2026-09-05/secret-scan.json` |
| Targeted local reproductions | Confirmed controller registration, cache isolation/retention, refresh replay, unpaid checkout handling, malformed return URL, Certn signature rejection, and geocode concurrency | `artifacts/production-audit-2026-09-05/reproductions.log` |

The toolchain initially reported Node 22.21.1 from the shell, but pnpm and later shim invocations resolved Node 26.8.1, outside the root project's `22.x` engine constraint. Separate builds of all three apps pass on the absolute Node 22.21.1 executable, and its backend suite reproduces the same four test failures; see the `*-node22.log` artifacts. Pin the runtime in CI rather than relying on the developer machine's shims. The migration failure was reproduced twice on the local Node 26 runtime; its missing-content prerequisite is independent of a Node-specific API error.

The migration check used a disposable PostgreSQL 16.6 container, its own database and credentials, and only the documented `uuid-ossp` and `pg_trgm` extensions. It did not run seeds. The container was removed after inspection. Browser E2E and external-provider integration tests were not run; a fresh database already fails the bootstrap prerequisite, and the configured tests can write users/bookings and invoke integrations. Secret scanning covered common token/key formats in current tracked text, not git history, every credential format, or environment-secret quality.

**Findings — P1 means fix before release; P2 means schedule promptly or explicitly accept the stated condition.**

**F01 · P1 · A fresh production database cannot finish migrating.**

Evidence: `apps/bff/src/domains/content-management/migrations/20260723000001-AddSpanishTutoringAndBasketballLessons.ts:150` and the migration log. Migration 77 throws `Cannot copy questions: source subcategory "French Tutoring" has no service_questions`. Earlier migrations create the category but do not establish this seed-data prerequisite. The documented order is migrate, then seed, so that sequence cannot bootstrap an empty database; later schema changes remain unapplied. An already-seeded production database may pass, but disaster recovery and new environments cannot rely on that assumption.

Fix: make required reference data deterministic before this migration, or provide a versioned bootstrap sequence that works from empty without manually interrupting migrations to seed. Verify a complete empty-database run and a second no-op run. Do not modify or delete existing production migration records to work around this.

**F02 · P1 · Standard Certn signed webhooks are rejected.**

Evidence: `apps/bff/src/domains/safety-verification/certn-webhook.controller.ts:32` and `:58`. The controller reads `x-certn-signature` / `x-webhook-signature`, accepts a bare hex digest or `sha256=...`, and hashes `JSON.stringify(body)`. Certn documents `Certn-Signature`, timestamped `t=...` / `v1=...` values, and HMAC over the timestamp, a dot, and the original request bytes. Local reproduction rejects the documented signature with HTTP 400 even when supplied to the controller's expected argument; the documented header is not read at all. Provider callbacks therefore cannot update verification through a standard direct integration. [Certn webhook protocol](https://docs.certn.co/api/certn-api-v-1.0/guides/use-the-api/webhooks).

Fix: consume the documented header and raw body, parse signature versions and timestamp, enforce freshness, and support overlapping signing secrets where needed. Add an integration fixture constructed from the provider protocol; current tests reproduce the application's own incompatible signing scheme. Confirm whether any deployed gateway currently translates the protocol.

**F03 · P1 · Background checks can be fulfilled before payment settles.**

Evidence: `apps/bff/src/domains/safety-verification/background-check-payment.service.ts:142` and `:199`. The webhook path trusts purpose/user/order metadata and marks an order paid without checking `payment_status`; the browser return path does check it. A mocked session with `payment_status: 'unpaid'` marked the order `paid` and called `onPaymentSucceeded`. Stripe Checkout completion and payment settlement differ for delayed payment methods. This is a business-logic defect on a signature-verified Stripe event, not an unauthenticated forged-webhook bypass. [Stripe fulfillment guidance](https://docs.stripe.com/checkout/fulfillment).

Fix: validate settlement and the expected order/session relationship, handle delayed success/failure events, and make fulfillment atomic and idempotent across webhook and browser confirmation. Test completed-but-unpaid, delayed success, duplicates, and concurrent confirmation. Impact depends on the payment methods enabled in the Stripe account.

**F04 · P1 · Background-check Checkout returns to a malformed profile URL.**

Evidence: `apps/bff/src/domains/safety-verification/background-check-payment.service.ts:53` and `:90`; `apps/web/app/(dashboard)/dashboard/profile/welper-setup-tab-panels.tsx:61`. The base path already ends with `?tab=backgroundCheck`, then success/cancel append another `?`. A success URL parses as `tab=backgroundCheck?payment=success` with no `payment` parameter. The frontend requires `payment === 'success'` to confirm the session, and the tab value no longer matches a supported tab. The E2E bypass URL has the same issue.

Fix: build the URL with `URL` / `searchParams.set`, preserving `tab` and adding separate `payment` and `session_id` parameters. Verify success and cancel paths in English and French, including the selected tab and payment-confirmation effect.

**F05 · P1 · The legacy auth controller remains active and exposes an unprotected resend path.**

Evidence: `apps/bff/src/domains/user-management/auth/auth.module.ts:71` and `:95`; `apps/bff/src/domains/user-management/auth/auth.controller.ts:93`. The static module registers its controller. `forRoot({registerController:false})` supplies an empty dynamic controller array, which extends the static metadata rather than removing it. Running the installed Nest scanner's controller-registration logic confirmed the legacy controller remains. [Nest module semantics](https://docs.nestjs.com/modules).

The distinct `POST /api/auth/resend-verification` route has only JWT authentication. Its service generates another verification token and sends email without the rate limit and human-verification requirement on the intended `/resend-verification-email` route. An authenticated unverified account can repeatedly use the legacy route. Several other auth paths are duplicated; this audit does not claim which duplicate wins without a complete live route-order trace.

Fix: remove static controller registration from the service-only module, register it solely when requested, and assert the final application's route inventory. Verify that the legacy resend route is absent or applies equivalent protection.

**F06 · P1 · Password-reset tokens and security limits are lost across backend instances or restarts.**

Evidence: `apps/bff/src/domains/user-management/cache/memory-cache.service.ts:15`, `cache.service.ts`, and `auth/password-reset.service.ts:73`. Password-reset tokens, lockouts, and request counters are stored in one process's `Map`. A token stored in instance A is absent in instance B. Load balancing can reject a valid reset link, deployment/restart invalidates outstanding links, and account/IP limits can be multiplied across instances. Sticky sessions do not make emailed links survive restart or a different browser.

Fix: use durable/shared storage for reset tokens and shared atomic rate-limit state. PostgreSQL is already available if adding a cache service is undesirable. Consume reset tokens atomically with the password change. Test request-on-A/confirm-on-B and restart during the reset window.

**F07 · P1 · Signup rate limits can block unrelated users behind a reverse proxy.**

Evidence: `apps/bff/src/modules/auth/auth.controller.ts:79` and `:251`; `apps/bff/src/main.ts`. Registration and signup allow five requests per hour keyed by `req.ip`. Bootstrap does not configure Express proxy trust. In a direct deployment behind an ALB or similar proxy, Express can see the proxy address for all callers, causing unrelated users to share the five-request bucket. This is conditional on the actual ingress topology, which was not supplied.

Fix: explicitly configure trusted proxy hops/subnets for the deployed ingress and reject spoofable forwarded-header assumptions. Verify two real client IPs receive separate limits and an untrusted caller cannot choose the effective IP. Do not set unrestricted proxy trust without checking network topology.

**F08 · P1 · A process crash can permanently suppress an unfinished Stripe webhook.**

Evidence: `apps/bff/src/domains/payment/payment.service.ts:1892` and `entities/processed-webhook-event.entity.ts`. The handler commits the event ID before applying its effects and treats any duplicate ID as completed. A crash after the insert but before/during processing leaves that claim permanently present: the next delivery returns success without finishing the work. The catch/delete cleanup only helps exceptions that execute inside the surviving process. Some payment rows have reconciliation paths, but the event table has no processing state or lease, and not every side effect is covered by those paths.

Fix: distinguish received/processing/completed states, give processing claims a reclaimable lease, and acknowledge completion only after durable processing. Use a durable inbox/worker or a carefully bounded transaction plus idempotent external effects. Test crash/restart after claim and before completion, including non-payment-intent events such as saved-payment-method changes.

**F09 · P1 · Request logging copies private communications and identity data into logs.**

Evidence: `apps/bff/src/common/interceptors/logging.interceptor.ts:11` and `:47`; installed globally in `main.ts`. Every request body, query and path parameter is logged. Redaction covers a short set of credential field names, but leaves message `content`, dispute `description`/evidence, profile and guardian contacts, and webhook identity fields untouched. Certn payloads can include sensitive identity details and signed document links. Production logs become a second store of sensitive customer data, outside the application's normal access controls and retention behavior.

Fix: log an allowlisted operational envelope—request ID, route, actor ID where appropriate, status, duration—and omit bodies by default. Use explicit short-lived, redacted debugging for individual routes. Review access and retention for existing logs. No production logs were inspected, so actual historical exposure is unverified.

**F10 · P2 · Locked production dependencies have outstanding security advisories.**

Evidence: `pnpm-lock.yaml:58`, `:412`, and the saved dependency audit. The registry returned 122 severity-counted findings across dependency paths, represented by 109 advisory records (3 critical, 48 high, 51 moderate, 7 low records). These counts are not 122 demonstrated application exploits. The critical records include `next-auth@5.0.0-beta.30` and `@auth/core@0.41.0`; one email advisory appears under both packages.

The configuration-error advisory affects existence-only auth checks. Reviewed web/admin entry guards check a user property, which follows the published mitigation. Both apps use Credentials providers, so the email-provider normalization issue is not demonstrated on the configured flow. Upgrade and triage remain warranted, but the scan alone does not establish an exploitable critical login bypass. Published patched minimums are NextAuth beta.32 and Auth Core 0.41.3 for these advisories. [Configuration-error advisory](https://github.com/advisories/GHSA-8fpg-xm3f-6cx3), [email-normalization advisory](https://github.com/advisories/GHSA-7rqj-j65f-68wh).

Fix: update compatible dependency chains, regenerate the lockfile, rerun production audits and auth/payment regressions, and record reachability or compensating controls for remaining advisories. See `artifacts/production-audit-2026-09-05/dependency-advisories.csv` for installed versions, patched ranges and dependency paths. Avoid applying forced major upgrades without testing.

**F11 · P2 · Signed uploads do not enforce the application's file-size limits at storage.**

Evidence: `apps/bff/src/modules/uploads/uploads.service.ts:36` and `apps/bff/src/clients/s3/s3-url-presigner.service.ts:126`. Profile and evidence uploads sign `PutObject` with a key/content type but no enforced object-length constraint. API/browser metadata checks do not constrain the bytes later sent directly to S3. An authenticated user can upload a much larger object than the UI allows, causing storage/bandwidth costs; the BFF's one-megabyte body parser does not apply to direct S3 requests.

Fix: use a presigned POST size policy or another verified upload-size enforcement mechanism, apply per-user quotas, and verify stored object size/type before making uploads available. Keep evidence private and confirm bucket policies separately. No oversized objects were uploaded during this audit.

**F12 · P2 · Refresh tokens can be replayed; sign-out does not revoke them.**

Evidence: `apps/bff/src/domains/user-management/auth/auth.service.ts:351` and the legacy controller's logout method. Refresh verifies a JWT and account `authVersion`, then issues another pair without consuming the old refresh token. Local reproduction accepted the same token twice. Password/status changes revoke older versions, which is a useful control, but ordinary refresh/sign-out do not invalidate a copied token. A stolen token can remain usable until expiry, and continued refresh can renew access while the account version stays unchanged.

Fix: track refresh sessions/token families, rotate with atomic consumption and reuse handling, and revoke the current session on logout. Preserve safe handling of concurrent browser refresh requests. Retain account-wide version invalidation for security changes.

**F13 · P2 · Expired cache keys accumulate without a size bound.**

Evidence: `apps/bff/src/domains/user-management/cache/memory-cache.service.ts:21` and `:41`. Expiration is lazy: a key is removed only when read again or visited through `keys`. A stream of distinct login emails or reset-token attempts creates keys that may never be revisited. There is no capacity bound or periodic expiry sweep. Local reproduction confirmed an expired entry remains in the map without another lookup. Accumulation can exhaust a long-running backend's memory.

Fix: use a bounded cache with actual expiry eviction, cap untrusted key cardinality, and enforce request limits before creating arbitrary key buckets. Moving reset/limit state to a shared store should include retention and capacity controls.

**F14 · P2 · The geocoding concurrency limit is bypassed by simultaneous requests.**

Evidence: `apps/bff/src/domains/geocode/rate-limiter.service.ts:33`. Calls inspect `activeRequests`, then await the interval delay before incrementing it. Concurrent callers all pass the pre-await check. Twenty simultaneous calls reproduced 20 active slots despite the configured limit of 10; they also wake together rather than maintaining the intended spacing. The public geocoding endpoints can therefore exceed the local provider-request cap.

Fix: reserve slots atomically before yielding and use a bounded queue with admission limits, cancellation, and per-caller throttling. Verify both maximum concurrency and request-start spacing under concurrent load.

**F15 · P2 · Admin browser headers are missing; web CSP allows unrestricted inline/eval scripts.**

Evidence: `apps/admin/next.config.ts:4` and `apps/web/next.config.ts:128`. The admin config defines no framing/CSP/referrer/permissions headers. The customer app has several useful headers, but its production script policy includes both `unsafe-inline` and `unsafe-eval`. This weakens defense against script injection; it is not evidence of an existing XSS payload. Hosting-level headers could compensate for the admin gap and must be checked on the deployed host.

Fix: establish an admin header baseline, including frame protection, and adopt an application-compatible nonce/hash script policy. Remove production eval permission where possible. Check real responses and exercise Stripe, Turnstile and other required integrations before enforcing a tighter policy.

**F16 · P2 · The backend regression suite is red because test fixtures lag the implementation.**

Evidence: `apps/bff/src/domains/dispute/dispute.service.spec.ts:108`, `:286`, `:490`; `apps/bff/src/domains/communication/communication.service.spec.ts:59` and `:430`. Two notification tests omit the newly called `resolveLocaleForUser` mock; the service catches that missing-method failure before the emission assertion. Two window tests set time only 11 minutes after completion while their settings mock now returns 1,440 minutes. Those cases therefore remain valid within the configured window.

Fix: update the mocks and define before/at/after deadline cases using the intended configured value. Confirm the product's report-window policy separately. These failures are test-maintenance defects; they do not prove that production notifications fail or that a 24-hour window is wrong. Make a green unit suite a required release check and manage the lint-warning backlog with a ratchet.

**F17 · P2 · Six-digit email codes have a global uniqueness constraint without collision retry.**

Evidence: `apps/bff/src/domains/user-management/auth/email-verification.service.ts:47` and `:57`; `entities/email-verification-token.entity.ts:19`. Codes are generated randomly in a roughly 900,000-value space and inserted into a globally unique token column without retrying a uniqueness violation. Used codes remain stored; the generation cleanup removes only unused codes for the same user. A collision can fail signup/resend before sending the code. This is a capacity/reliability defect, not a demonstrated cross-account verification bypass.

Fix: bind code lookup to user/email and make uniqueness appropriately scoped, or implement safe collision retry plus cleanup. Test a forced collision and reuse after expiry. Keep attempt limits and email binding intact.

**Release and live-environment evidence gaps**

The current repo has no checked-in CI/CD workflow or app Dockerfiles; `documentation/operations/deployment.md:5` explicitly describes the gap. `infrastructure/lib/infrastructure-stack.ts` and `lib/stacks/database-stack.ts` define no production resources, and the infrastructure test has its actual assertions commented out. Thus these files cannot reproduce a deployment or establish backup, restore, IAM, network, or rollback controls. A hosting dashboard may supply controls outside the repo; absence here is not proof they are absent in production.

Before signing off, collect and verify:

| Area | Required evidence |
|---|---|
| Hosting and runtime | Production URLs, deployed commit, runtime version, ingress topology, replica count, and environment validation |
| Release controls | Required tests/build/migration checks, immutable release artifacts, migration ownership/serialization, and a tested rollback procedure |
| Database recovery | Backup/PITR settings, retention, encryption, connection restrictions, restore drill and agreed recovery objectives |
| Storage | Separate public profile/private evidence access policies, actual IAM grants, upload limits, lifecycle cleanup and signed-link behavior |
| Payment operations | Stripe methods/events, signature-secret wiring, retry/reconciliation monitoring, refund/payout failure handling and audit trails |
| Background jobs | A persistent worker or external scheduler for the BFF's in-process payment cron; verify execution if hosted on request-driven/serverless compute |
| Observability | Error and latency metrics, alert ownership, failed/stale payment and background-check alerts, redacted log retention, graceful shutdown |
| User journeys | Browser tests for signup, email verification, background-check payment and return, booking/receipt/payment, dispute, payout and admin authorization |
| Accessibility/performance | Keyboard and assistive-technology review, mobile layouts, measured Core Web Vitals, realistic search/load tests and query plans |
| Data lifecycle | Verified account deletion/retention behavior across operational records, evidence objects and provider data; this audit does not certify legal compliance |

**Suggested remediation order**

1. Repair migrations and the background-check contract: F01–F04. Add empty-database and provider-protocol fixtures as release gates.
2. Remove the legacy auth route, make security state shared/durable, configure trusted ingress, and recover crashed webhook work: F05–F08.
3. Restrict request logging and verify actual production data-access controls: F09 and the storage/observability evidence gaps.
4. Triage and update dependencies, bound uploads/cache/geocoding, improve session revocation and headers, then fix the stale tests and OTP collision handling: F10–F17.
5. Verify the actual deployed environment and execute isolated staging journeys before release approval. Build success alone does not close the identified blockers.

**Reproduction and evidence**

The saved `artifacts/production-audit-2026-09-05/reproduce.cjs` loads the actual TypeScript implementations with mocked repositories/providers. It does not call Stripe, Certn, SMTP, or a production database. Run it from this checkout with `node artifacts/production-audit-2026-09-05/reproduce.cjs`; it currently embeds this checkout's absolute path. The output contains only synthetic audit identifiers.

The dependency CSV and full registry JSON retain package paths so advisories can be assessed individually. Raw logs preserve both successful checks and failures. No source fixes were made in this audit; generated changes to the admin Next.js environment declaration were restored.
