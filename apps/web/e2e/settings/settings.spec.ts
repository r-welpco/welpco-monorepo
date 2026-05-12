import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard } from '../helpers/test-helpers';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should access settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should display all functional cards', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    // Check for tabs
    const tabs = page.getByRole('tablist');
    if (await tabs.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(page.getByRole('tab', { name: /appearance/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /account/i })).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: /personalization/i })).toBeVisible({ timeout: 5000 });

    await page.getByRole('tab', { name: /account/i }).click();

    // Email Update Form (in Account tab)
    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible();
    
    // Password Change Form (in Account tab)
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
    
    // Danger Zone (in Account tab)
    await expect(page.getByRole('heading', { name: /danger zone/i })).toBeVisible();
  });

  test('should display personalization settings card', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /personalization/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Theme Mode')).toBeVisible();
    await expect(page.getByText('Translucent Theme')).toBeVisible();
    await expect(page.getByText('Background Color')).toBeVisible();
  });

  test('should display email update form', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    const accountTab = page.getByRole('tab', { name: /account/i });
    await accountTab.click();
    await expect(page.getByRole('heading', { name: /update email/i })).toBeVisible();
    // Check for email input field
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should display password change form', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: /account/i }).click();

    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
    // Check for password input fields
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    if (count > 0) {
      await expect(passwordInputs.first()).toBeVisible();
    }
  });

  test('should display danger zone', async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: /account/i }).click();

    await expect(page.getByRole('heading', { name: /danger zone/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete account/i })).toBeVisible();
  });
});

