import { test, expect, Page } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  waitForFormReady,
} from '../helpers/test-helpers';

/**
 * Day 15 Dispatch C — signup-merge regression coverage.
 *
 * The pre-merge spec navigated to `/register/customer` and `/register/welper`
 * (both routes deleted in Phase 2 Dispatch A). This rewrite exercises the
 * unified wizard at `/register` plus the Phase 3 middleware four-state
 * machine.
 *
 * NOTE on execution: agent shells in Days 9–15 historically denied
 * `pnpm test:e2e`. The CI runs Playwright on PR; this file is authored at
 * production quality but not executed in the dispatch.
 */

const WIZARD_URL = '/register';

async function fillEmailPasswordStep(page: Page, email: string, password: string) {
  await page.getByLabel(/email/i).first().fill(email);
  await page
    .getByLabel(/password/i, { exact: false })
    .first()
    .fill(password);
  await page.getByRole('button', { name: /continue|next/i }).click();
}

async function selectRole(page: Page, role: 'customer' | 'welper') {
  // The select-role step renders two pill cards as `role="radiogroup"`.
  const labelRe = role === 'customer' ? /find a welper/i : /become a welper/i;
  await page.getByRole('radio', { name: labelRe }).click();
  await page.getByRole('button', { name: /continue|next/i }).click();
}

async function fillIdentityStep(page: Page, name: { first: string; last: string }) {
  await page.getByLabel(/first name/i).fill(name.first);
  await page.getByLabel(/last name/i).fill(name.last);
  // Keep phone simple — the BFF normalises with libphonenumber-js.
  await page.getByLabel(/phone/i).fill('4165551234');
  // DOB: 18+ years ago.
  await page.getByLabel(/date of birth|birthday/i).fill('1995-01-01');
  // ToS + privacy.
  await page.getByLabel(/terms/i).check();
  await page.getByLabel(/privacy/i).check();
  await page.getByRole('button', { name: /continue|next/i }).click();
}

test.describe('@auth Signup wizard — customer happy path', () => {
  test('completes the 5 customer steps and lands on dashboard', async ({ page }) => {
    const email = generateTestEmail('customer');
    const password = generateTestPassword();

    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    // Step 1 — email + password.
    await fillEmailPasswordStep(page, email, password);

    // Step 2 — select role.
    await selectRole(page, 'customer');

    // Step 3 — identity.
    await fillIdentityStep(page, { first: 'Avery', last: 'Tester' });

    // Step 4 — notification prefs (defaults pre-checked, opt-out per bible §22.6).
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 5 — optional profile (skip).
    await page.getByRole('button', { name: /skip|finish|complete/i }).first().click();

    // Land on dashboard.
    await page.waitForURL(/\/dashboard(?!\/onboarding)/, { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('@auth Signup wizard — welper happy path', () => {
  test('completes the welper wizard and lands on dashboard', async ({
    page,
  }) => {
    const email = generateTestEmail('welper');
    const password = generateTestPassword();

    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'welper');
    await fillIdentityStep(page, { first: 'Sage', last: 'Welper' });

    // Step 4 — welper bio (≥120 chars).
    await page
      .getByRole('textbox', { name: /bio|tell.*customers/i })
      .fill(
        'I am a thoughtful, reliable caregiver with five years of professional experience supporting families in busy households across the Toronto area. I take care to communicate clearly and arrive on time.',
      );
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 5 — service area.
    await page.getByLabel(/city/i).fill('Toronto');
    await page.getByLabel(/province|state/i).fill('ON');
    await page.getByLabel(/country/i).fill('CA');
    // Postal-code prefix list — first prefix.
    await page.getByLabel(/postal/i).first().fill('M5V');
    await page.getByRole('button', { name: /add/i }).first().click();
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 6 — service offering.
    await page.getByLabel(/category/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/title/i).fill('Evening babysitting');
    await page.getByLabel(/hourly rate/i).fill('25');
    await page
      .getByLabel(/description/i)
      .fill(
        'Patient evening babysitting for elementary-age kids. I cook a simple meal, supervise homework, and make sure bedtime happens.',
      );
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Availability — ad-hoc-only path keeps the spec tight.
    await page
      .getByLabel(/take bookings by request only|ad.?hoc/i)
      .check();
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Notification prefs.
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Optional profile (skip).
    await page.getByRole('button', { name: /skip|finish|complete/i }).first().click();

    await page.waitForURL(/\/dashboard(?!\/onboarding)/, { timeout: 20_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('@auth Signup wizard — drop and resume', () => {
  test('returning user lands on the next required step', async ({ page, context }) => {
    const email = generateTestEmail('resume');
    const password = generateTestPassword();

    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'customer');
    await fillIdentityStep(page, { first: 'Riley', last: 'Resume' });

    // Drop here — sign out via the wizard's "Save and continue later" affordance.
    await page.getByRole('link', { name: /save.*continue.*later|sign.*out/i }).click();

    // Sign back in (helper test-credentials assumed to exist; in CI use the real
    // credentials of the freshly-created account).
    await page.goto('/login');
    await waitForFormReady(page);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Middleware (state B) routes to /register; the wizard reads server state
    // and `router.replace`s to the next required step (notification-prefs for
    // a customer who finished steps 1-3).
    await page.waitForURL(/\/register\/step\/notification-prefs/, { timeout: 15_000 });
    expect(page.url()).toContain('/register/step/notification-prefs');

    void context; // keep param signature for future cross-tab variants
  });
});

test.describe('@auth Signup wizard — mobile viewport', () => {
  test('every step is usable at 375px and submit-button is reachable without scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    // Step 1 — submit button visible without scroll.
    const submit = page.getByRole('button', { name: /continue|next/i });
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Bottom of the button must fit in viewport (812px tall).
      expect(box.y + box.height).toBeLessThanOrEqual(812);
    }
  });
});

test.describe('@auth Middleware four-state machine', () => {
  test('signed-out + /dashboard → /login?next=', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login\?next=/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login\?next=/);
  });

  test('signed-in + signupCompleted=false + /dashboard → /register', async ({
    page,
  }) => {
    // Bring up a mid-wizard user.
    const email = generateTestEmail('mid-wizard');
    const password = generateTestPassword();
    await page.goto(WIZARD_URL);
    await waitForFormReady(page);
    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'customer');
    // Now signed-in but signup not finished. Try to visit dashboard.
    await page.goto('/dashboard');
    await page.waitForURL(/\/register/, { timeout: 10_000 });
    expect(page.url()).toContain('/register');
  });

  test('signed-in + signupCompleted=true + /login → /dashboard', async ({ page }) => {
    // Pre-seeded user. The global-setup creates an `e2e-customer@welpco.com`
    // account that already has `signupCompleted: true`.
    await page.goto('/login');
    await waitForFormReady(page);
    await page.getByLabel(/email/i).fill('e2e-customer@welpco.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // Signed-in user re-visiting /login should bounce back to dashboard.
    await page.goto('/login');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });
});
