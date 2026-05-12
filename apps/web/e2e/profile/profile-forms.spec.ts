import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard, switchTab, getErrorMessage } from '../helpers/test-helpers';

test.describe('Profile Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should switch between profile tabs', async ({ page }) => {
    await page.goto('/dashboard/profile', { waitUntil: 'load' });

    await switchTab(page, 'Personal Info');
    const nameInput = page.locator('#customer-first-name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    await switchTab(page, 'Service Preferences');
    await expect(page.getByText('Preferred service categories')).toBeVisible({ timeout: 5000 });

    await switchTab(page, 'Favorites');
    await switchTab(page, 'Overview');
  });

  test('should show validation when required fields are empty', async ({ page }) => {
    await page.goto('/dashboard/profile', { waitUntil: 'load' });
    await switchTab(page, 'Personal Info');

    const firstNameInput = page.locator('#customer-first-name');
    await expect(firstNameInput).toBeVisible({ timeout: 5000 });
    await firstNameInput.clear();

    const saveButton = page.getByRole('button', { name: /save profile/i });
    await expect(saveButton).toBeVisible({ timeout: 3000 });
    await saveButton.click();

    const errorMessage = await getErrorMessage(page);
    const inlineError = page.locator('text=/required|invalid/i').first();
    const hasError = errorMessage?.match(/required|invalid/i) || (await inlineError.isVisible({ timeout: 2000 }).catch(() => false));
    expect(hasError).toBeTruthy();
  });
});
