# Next phase: validate real application flows and prepare for merge

Status: Planned — deferred for later implementation.
Saved: 2026-09-07.

## Summary

Use the **isolated local stack** selected during planning to close the remaining integration gaps. The recorded remediation baseline is 503 passing stories, 120 responsive checks, and 10 consumer fixtures. The next milestone is a reviewable change with evidence that authenticated workflows still work.

Prior implementation evidence: [Design-system remediation report](../audits/2026-09-05-design-system-remediation.md). Recheck the workspace and service state when resuming; these results describe the previous verification run.

## 1. Establish an isolated integration environment

- Run Node 22 with dedicated PostgreSQL, Mailpit, and MinIO containers and separate volumes. Preserve existing development data and running services.
- Run the BFF on port 3001, web on 8081, and admin on 8082; fail clearly if those ports are occupied.
- Apply existing migrations and seed fixtures only in the disposable database. Include customer, welper, administrator, and dual-role accounts.
- Use temporary auth secrets, local email/storage, and stubbed SMS. Use Stripe test-mode credentials for payment verification.
- Add `pnpm check:design-system:integration` with a dedicated Playwright configuration. Bypass the existing setup that automatically seeds data and logs login responses. Fail immediately when required services are unavailable.

## 2. Verify authenticated functionality

Run against the actual applications and BFF, without mocking the API operations being validated:

- **Accounts:** customer/welper sign-in, registration and email verification, admin account creation, and protected-route permissions.
- **Profiles and discovery:** radius/price filters, trust badges, photo cropping and persisted uploads, appearance settings after reload.
- **Dialogs and roles:** role switching, correct session/navigation changes, pending dismissal guards, and keyboard focus return.
- **Messaging:** successful sending, failed-send draft retention, editing while pending, and prevention of duplicate requests.
- **Booking/payment:** normal booking lifecycle, Stripe test-mode authorization/confirmation, failure recovery, and webhook-driven state updates.

Check persisted results after reload. Record missing prerequisites as blocked checks; they must not count as passes.

## 3. Complete visual review and continuous checks

- Review affected authenticated screens in English/French, light/dark, at 375, 768, and 1440px.
- Accept only the intended accessibility, contrast, dialog-layout, and typography differences.
- Add GitHub Actions coverage for the existing design-system verifier and web/admin type checks and builds. Upload screenshots and failure traces.
- Keep credential-dependent Stripe verification separate, with its result required in the release report.
- Preserve the file/rule lint baseline; reject increases without expanding this work into unrelated warning cleanup.

## 4. Prepare the change for merge

- Separate the work into dependency-ordered commits: regression protection, component fixes, dialog consolidation, then typography.
- Keep each commit buildable, including its required tests and dependencies. Exclude unrelated workspace changes.
- Update the verification report with integration results, screenshots, remaining blockers, and rollback boundaries.
- Prepare a draft PR. Keep typography last and obtain screenshot review before merging.

## Acceptance criteria and boundaries

All existing checks remain green, required integration scenarios pass, and no unexplained visual differences remain. No production deployment, framework upgrades, business-logic changes, new production APIs, or broad component cleanup are included. Missing Stripe test credentials leave the payment gate explicitly blocked.
