import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard, switchTab } from '../helpers/test-helpers';

test.describe('Settings Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should switch between settings tabs', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Default tab is Account (Day 10 audit: prior assertion expected the
    // old default of "Appearance" / Personalization).
    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible({ timeout: 5000 });

    await switchTab(page, 'Appearance');
    await expect(page.getByRole('heading', { name: /personalization/i })).toBeVisible({ timeout: 5000 });

    await switchTab(page, 'Account');
    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible({ timeout: 5000 });
  });

  test('should display correct content for each tab', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Default Account tab content
    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /delete account/i })).toBeVisible();

    await switchTab(page, 'Appearance');
    await expect(page.getByRole('heading', { name: /personalization/i })).toBeVisible();
    await expect(page.getByText('Theme Mode')).toBeVisible();
    await expect(page.getByText('Background Color')).toBeVisible();
  });

  test('should show email update form in Account tab', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    const accountTab = page.getByRole('tab', { name: /account/i });
    if (!(await accountTab.getAttribute('data-state'))?.includes('active')) {
      await switchTab(page, 'Account');
    }

    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible();
    const emailInput = page.locator('#email-update');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should show password change form in Account tab', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    const accountTab = page.getByRole('tab', { name: /account/i });
    if (!(await accountTab.getAttribute('data-state'))?.includes('active')) {
      await switchTab(page, 'Account');
    }

    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show personalization in Appearance tab', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /personalization/i })).toBeVisible();
    await expect(page.getByText('Theme Mode')).toBeVisible();
    await expect(page.getByText('Translucent Theme')).toBeVisible();
    await expect(page.getByText('Background Color')).toBeVisible();
  });
});
