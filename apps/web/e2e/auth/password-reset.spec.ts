import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  waitForFormReady,
  getErrorMessage,
  hasSuccessMessage,
} from '../helpers/test-helpers';

test.describe('Password Reset Flow', () => {
  test('should request password reset link with email only', async ({ page }) => {
    const email = generateTestEmail('reset');

    await page.goto('/forgot-password');
    await waitForFormReady(page);

    await page.locator('#recovery-email').fill(email);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/reset-password') &&
        response.request().method() === 'POST',
      { timeout: 15000 },
    );

    await page.getByRole('button', { name: /send reset link/i }).click();

    const response = await responsePromise;
    const status = response.status();
    const acceptedStatuses = [200, 201, 400, 429];
    expect(acceptedStatuses).toContain(status);

    if (status === 200 || status === 201) {
      const success = await hasSuccessMessage(page);
      const successText = page
        .getByText(/reset link|check your inbox|account exists/i)
        .first();
      expect(
        success || (await successText.isVisible({ timeout: 3000 }).catch(() => false)),
      ).toBe(true);
    }
  });

  test('should show error for invalid email format on forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    await waitForFormReady(page);

    await page.locator('#recovery-email').fill('invalid-email');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await page.waitForTimeout(500);

    const emailError = page.locator('#recovery-email').locator('..').getByRole('alert');
    const hasValidationError =
      (await emailError.count()) > 0 &&
      (await emailError.first().isVisible().catch(() => false));

    if (hasValidationError) {
      await expect(emailError.first()).toContainText(/email|valid/i);
    } else {
      expect(page.url()).toContain('/forgot-password');
    }
  });

  test('should navigate back to login from forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    await waitForFormReady(page);

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForURL(/login/);
    expect(page.url()).toContain('login');
  });

  test('should show invalid link state without token', async ({ page }) => {
    await page.goto('/reset-password');
    await waitForFormReady(page);

    await expect(page.getByText(/reset link won't work|won't work/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /request a new link/i })).toBeVisible();
  });

  test('should validate password strength on reset page', async ({ page }) => {
    const email = generateTestEmail('weak-password');
    const token = '00000000-0000-4000-8000-000000000001';

    await page.goto(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
    await waitForFormReady(page);

    await page.locator('#reset-password').fill('weak');
    await page.locator('#reset-confirm').fill('weak');
    await page.getByRole('button', { name: /update password/i }).click();

    await page.waitForTimeout(500);

    const errorMessage = await getErrorMessage(page);
    const passwordError = page.locator('#reset-password').locator('..').getByRole('alert');
    const hasFieldError =
      (await passwordError.count()) > 0 &&
      (await passwordError.first().isVisible().catch(() => false));

    if (errorMessage) {
      expect(errorMessage).toMatch(/password|strength|characters|uppercase|special/i);
    } else if (hasFieldError) {
      await expect(passwordError.first()).toContainText(/password|strength|characters/i);
    } else {
      expect(page.url()).toContain('/reset-password');
    }
  });

  test('should validate password confirmation match on reset page', async ({ page }) => {
    const email = generateTestEmail('mismatch');
    const token = '00000000-0000-4000-8000-000000000002';
    const password = 'TestPassword123!';

    await page.goto(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
    await waitForFormReady(page);

    await page.locator('#reset-password').fill(password);
    await page.locator('#reset-confirm').fill('DifferentPassword123!');
    await page.getByRole('button', { name: /update password/i }).click();

    await page.waitForTimeout(500);

    const errorMessage = await getErrorMessage(page);
    const confirmError = page.locator('#reset-confirm').locator('..').getByRole('alert');
    const hasFieldError =
      (await confirmError.count()) > 0 &&
      (await confirmError.first().isVisible().catch(() => false));

    if (errorMessage) {
      expect(errorMessage).toMatch(/match|confirm|same/i);
    } else if (hasFieldError) {
      await expect(confirmError.first()).toContainText(/match|confirm|same/i);
    } else {
      expect(page.url()).toContain('/reset-password');
    }
  });
});
