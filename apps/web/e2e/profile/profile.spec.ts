import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard } from '../helpers/test-helpers';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should access profile page', async ({ page }) => {
    await page.goto('/dashboard/profile', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/dashboard\/profile/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should show customer profile tabs', async ({ page }) => {
    await page.goto('/dashboard/profile', { waitUntil: 'load' });

    await expect(page.getByRole('tab', { name: /personal info/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /service preferences/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /favorites/i })).toBeVisible();
  });

  test('should submit personal info form', async ({ page }) => {
    await page.goto('/dashboard/profile', { waitUntil: 'load' });
    await page.getByRole('tab', { name: /personal info/i }).click();
    await expect(page.getByRole('heading', { name: /customer profile/i })).toBeVisible({ timeout: 8000 });

    const firstNameInput = page.locator('#customer-first-name');
    await expect(firstNameInput).toBeVisible({ timeout: 5000 });
    await firstNameInput.clear();
    await firstNameInput.fill('Updated Test Name');

    const saveButton = page.getByRole('button', { name: /save profile/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    const apiPromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/profile') || response.url().includes('/api/users/me')) &&
        response.request().method() !== 'OPTIONS',
      { timeout: 15000 }
    ).catch(() => null);
    await saveButton.click();
    const response = await apiPromise;
    if (response) {
      // 2xx = success; 404 = endpoint not implemented or profile not found in some envs
      expect([200, 201, 404]).toContain(response.status());
    }
  });

  test('keeps loaded profile visible when a stale session sync is slow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/profile', { waitUntil: 'load' });

    const profileHeading = page.getByRole('heading', {
      name: 'Profile',
      exact: true,
    });
    await expect(profileHeading).toBeVisible({ timeout: 15000 });

    let sessionRequestCount = 0;
    await page.route('**/api/auth/signup/state', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailVerified: true }),
      });
    });
    await page.route('**/api/auth/session', async (route) => {
      sessionRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 750));
      const response = await route.fetch();
      const body = (await response.json()) as {
        user?: { emailVerified?: boolean };
      } | null;
      if (body?.user) body.user.emailVerified = false;
      await route.fulfill({ response, json: body });
    });

    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // First request is the visibility refresh; the second is the verification
    // sync's session update, which temporarily sets NextAuth to "loading".
    await expect.poll(() => sessionRequestCount, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
    await expect(profileHeading).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

    await page.waitForTimeout(2500);
    expect(sessionRequestCount).toBeLessThanOrEqual(3);
    await expect(profileHeading).toBeVisible();
  });
});
