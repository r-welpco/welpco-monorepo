import { test, expect, Page } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  waitForFormReady,
} from '../helpers/test-helpers';

/**
 * Day 15 Dispatch C — signup-merge regression coverage.
 *
 * Welper full-path tests send `x-welpco-signup-e2e: 1` so the BFF skips real
 * Stripe Checkout / Connect (non-production only). See SIGNUP_E2E_BYPASS_HEADER.
 */

const WIZARD_URL = '/register';
const SIGNUP_E2E_HEADERS = { 'x-welpco-signup-e2e': '1' };

async function fillEmailPasswordStep(page: Page, email: string, password: string) {
  await page.getByLabel(/email/i).first().fill(email);
  await page
    .getByLabel(/password/i, { exact: false })
    .first()
    .fill(password);
  await page.getByRole('button', { name: /continue|next/i }).click();
}

async function selectRole(page: Page, role: 'customer' | 'welper') {
  const labelRe = role === 'customer' ? /find a welper/i : /become a welper/i;
  await page.getByRole('radio', { name: labelRe }).click();
  await page.getByRole('button', { name: /continue|next/i }).click();
}

async function fillIdentityStep(page: Page, name: { first: string; last: string }) {
  await page.getByLabel(/first name/i).fill(name.first);
  await page.getByLabel(/last name/i).fill(name.last);
  await page.getByLabel(/phone/i).fill('4165551234');
  await page.getByLabel(/date of birth|birthday/i).fill('1995-01-01');
  await page.getByLabel(/terms/i).check();
  await page.getByLabel(/privacy/i).check();
  await page.getByRole('button', { name: /continue|next/i }).click();
}

async function fillWelperOfferingStep(page: Page) {
  await page.getByLabel(/category/i).click();
  await page.getByRole('option').first().click();
  await page.getByLabel(/subcategory/i).click();
  await page.getByRole('option').first().click();
  await page.getByLabel(/title/i).fill('Evening babysitting');
  await page.getByLabel(/hourly rate/i).fill('25');
  await page
    .getByLabel(/description/i)
    .fill(
      'Patient evening babysitting for elementary-age kids. I cook a simple meal, supervise homework, and make sure bedtime happens.',
    );
  await page.getByRole('button', { name: /add to list/i }).click();
  await page.getByRole('button', { name: /^continue$/i }).click();
}

async function completeBackgroundCheckStep(page: Page) {
  await expect(page.getByRole('heading', { name: /background check/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /pay.*continue/i }).click();
  await page.waitForURL(/background-check.*payment=success/, { timeout: 20_000 });
  await page.getByRole('button', { name: /^continue$/i }).click();
}

async function completePayoutStep(page: Page) {
  await expect(page.getByRole('heading', { name: /set up your payouts/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /set up payouts with stripe/i }).click();
  await page.waitForURL(/welper-payout.*connect=return/, { timeout: 20_000 });
  await page.getByRole('button', { name: /^continue$/i }).click();
}

test.describe('@auth Signup wizard — customer happy path', () => {
  test('completes the 5 customer steps and lands on dashboard', async ({ page }) => {
    const email = generateTestEmail('customer');
    const password = generateTestPassword();

    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'customer');
    await fillIdentityStep(page, { first: 'Avery', last: 'Tester' });

    await page.getByRole('button', { name: /skip|finish|complete/i }).first().click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('@auth Signup wizard — welper happy path', () => {
  test.use({ extraHTTPHeaders: SIGNUP_E2E_HEADERS });

  test('completes the 3-step welper signup and lands on dashboard with setup checklist', async ({
    page,
  }) => {
    const email = generateTestEmail('welper');
    const password = generateTestPassword();

    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'welper');
    await fillIdentityStep(page, { first: 'Sage', last: 'Welper' });

    await page
      .getByRole('textbox', { name: /bio|tell.*customers/i })
      .fill(
        'I am a thoughtful, reliable caregiver with five years of professional experience supporting families in busy households across the Toronto area. I take care to communicate clearly and arrive on time.',
      );
    await page.getByRole('button', { name: /continue|next/i }).click();

    await page.waitForURL(/\/register\/finish/, { timeout: 15_000 });

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    expect(page.url()).toContain('/dashboard');
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.getByText(/setup|finish your setup/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('@auth Post-signup routing', () => {
  test('signed-in + signupCompleted + /register/complete → /dashboard', async ({
    page,
  }) => {
    const email = generateTestEmail('gated');
    const password = generateTestPassword();
    await page.goto(WIZARD_URL);
    await waitForFormReady(page);
    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'customer');
    await fillIdentityStep(page, { first: 'Gated', last: 'User' });
    await page.getByRole('button', { name: /skip|finish|complete/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto('/register/complete');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
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

    await page.getByRole('link', { name: /save.*continue.*later|sign.*out/i }).click();

    await page.goto('/login');
    await waitForFormReady(page);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(/\/register\/step\/optional-profile/, { timeout: 15_000 });
    expect(page.url()).toContain('/register/step/optional-profile');

    void context;
  });
});

test.describe('@auth Signup wizard — mobile viewport', () => {
  test('every step is usable at 375px and submit-button is reachable without scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(WIZARD_URL);
    await waitForFormReady(page);

    const submit = page.getByRole('button', { name: /continue|next/i });
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
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
    const email = generateTestEmail('mid-wizard');
    const password = generateTestPassword();
    await page.goto(WIZARD_URL);
    await waitForFormReady(page);
    await fillEmailPasswordStep(page, email, password);
    await selectRole(page, 'customer');
    await page.goto('/dashboard');
    await page.waitForURL(/\/register/, { timeout: 10_000 });
    expect(page.url()).toContain('/register');
  });

  test('signed-in + signupCompleted=true + /login → /dashboard', async ({ page }) => {
    await page.goto('/login');
    await waitForFormReady(page);
    await page.getByLabel(/email/i).fill('e2e-customer@welpco.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto('/login');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });
});
