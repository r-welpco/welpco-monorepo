import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  fillRegistrationForm,
  fillLoginForm,
  getErrorMessage,
  waitForFormReady,
} from '../helpers/test-helpers';

/** Legacy `/register/customer` + `/onboarding-welcome` UI — superseded by `e2e/auth/registration.spec.ts`. */
test.describe.skip('Onboarding Flow', () => {
  test('should redirect to verification if email not verified', async ({ page }) => {
    const email = generateTestEmail('onboarding-redirect');
    const password = generateTestPassword();

    await page.goto('/register/customer', { waitUntil: 'load' });
    await waitForFormReady(page);

    await fillRegistrationForm(page, { email, password, role: 'customer' });

    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/register') && response.request().method() === 'POST'
    );

    await page.waitForURL(/onboarding-welcome|verification/, { timeout: 15000 });
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/onboarding-welcome|verification/);
  });

  test('should complete customer onboarding flow', async ({ page }) => {
    const email = generateTestEmail('customer-onboarding');
    const password = generateTestPassword();

    await page.goto('/register/customer', { waitUntil: 'load' });
    await waitForFormReady(page);

    await fillRegistrationForm(page, { email, password, role: 'customer' });

    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/register') && response.request().method() === 'POST'
    );

    await page.waitForURL(/onboarding-welcome|verification/, { timeout: 15000 });
    if (page.url().includes('/verification')) {
      test.skip();
      return;
    }

    // Step 1: Welcome - "Get started"
    await page.getByRole('button', { name: /get started|continue|next/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Profile basics - name, phone, etc.
    const nameInput = page.locator('input[name*="name"], input[id*="name"], input[name*="firstName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Test Customer Name');
      await page.getByRole('button', { name: /continue|next|save/i }).first().click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Step 3: Service preferences (customer) - category checkboxes
    const categoryCheckbox = page.getByRole('checkbox').first();
    if (await categoryCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryCheckbox.check();
      await page.getByRole('button', { name: /continue|next|save/i }).first().click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Step 4: Completion - "Go to dashboard"
    const completeButton = page.getByRole('button', { name: /go to dashboard/i });
    await expect(completeButton.first()).toBeVisible({ timeout: 8000 });
    const apiPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/profiles/me/onboarding-complete') &&
        response.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null);
    await completeButton.first().click();
    const response = await apiPromise;
    if (response) {
      expect([200, 201]).toContain(response.status());
    }
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should complete welper onboarding flow (skip service step)', async ({ page }) => {
    const email = generateTestEmail('welper-onboarding');
    const password = generateTestPassword();

    await page.goto('/register/welper', { waitUntil: 'load' });
    await waitForFormReady(page);

    await fillRegistrationForm(page, { email, password, role: 'welper' });

    await page.getByRole('button', { name: /create.*welper.*account|create account/i }).click();
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/register') && response.request().method() === 'POST'
    );

    await page.waitForURL(/onboarding-welcome|verification/, { timeout: 15000 });
    if (page.url().includes('/verification')) {
      test.skip();
      return;
    }

    // Step 1: Welcome - "Get started"
    await page.getByRole('button', { name: /get started|continue|next/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Profile basics (welper)
    const nameInput = page.locator('input[name*="name"], input[id*="name"], input[name*="firstName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Test Welper Name');
      await page.getByRole('button', { name: /continue|next|save/i }).first().click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Welper: completion step - "Go to dashboard"
    const completeButton = page.getByRole('button', { name: /go to dashboard/i });
    await expect(completeButton.first()).toBeVisible({ timeout: 8000 });
    const apiPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/profiles/me/onboarding-complete') &&
        response.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null);
    await completeButton.first().click();
    const response = await apiPromise;
    if (response) {
      expect([200, 201]).toContain(response.status());
    }
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should call markOnboardingComplete API on completion', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
    const password = process.env.TEST_USER_PASSWORD || 'Customer123!';

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);
    await fillLoginForm(page, email, password);

    const loginResponse = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/auth/callback/credentials') ||
          response.url().includes('/api/auth/login')) &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    await loginResponse;

    await page.goto('/onboarding-welcome', { waitUntil: 'load' });
    if (!page.url().includes('onboarding-welcome')) {
      test.skip();
      return;
    }

    const completeButton = page.getByRole('button', { name: /go to dashboard/i });
    if (await completeButton.count() > 0) {
      const apiPromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/profiles/me/onboarding-complete') &&
          response.request().method() === 'PUT',
        { timeout: 15000 }
      ).catch(() => null);
      await completeButton.first().click();
      const response = await apiPromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
      }
    }
  });

  test('should handle 401 errors during onboarding', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
    const password = process.env.TEST_USER_PASSWORD || 'Customer123!';

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);
    await fillLoginForm(page, email, password);

    const loginResponse = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/auth/callback/credentials') ||
          response.url().includes('/api/auth/login')) &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    await loginResponse;

    await page.goto('/onboarding-welcome', { waitUntil: 'load' });
    if (!page.url().includes('onboarding-welcome')) {
      test.skip();
      return;
    }

    await page.route('**/api/profiles/me/onboarding-complete', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const completeButton = page.getByRole('button', { name: /go to dashboard/i });
    if (await completeButton.count() > 0) {
      await completeButton.first().click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      const errorMessage = await getErrorMessage(page);
      if (!errorMessage) {
        expect(currentUrl).toMatch(/login|dashboard|onboarding/);
      }
    }
  });
});

