import { test, expect } from '@playwright/test';
import {
  getBaseURL,
  loginAndNavigateToDashboard,
  selectBackground,
  switchTab,
} from '../helpers/test-helpers';

async function openAppearanceTab(page: import('@playwright/test').Page) {
  await page.goto(getBaseURL() + '/dashboard/settings', {
    waitUntil: 'load',
    timeout: 15000,
  });
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
    timeout: 10000,
  });
  await switchTab(page, 'Appearance');
  await expect(page.getByText('Personalization')).toBeVisible({ timeout: 10000 });
}

test.describe('Personalization', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
    await page.evaluate(() => localStorage.removeItem('welpco-personalization'));
  });

  test('opens Appearance tab and shows theme and background options', async ({
    page,
  }) => {
    await openAppearanceTab(page);
    await expect(page.getByText('Theme Mode')).toBeVisible();
    await expect(page.getByText('Background Color')).toBeVisible();
  });

  test('saves theme mode to storage', async ({ page }) => {
    await openAppearanceTab(page);
    await page.getByText('Dark', { exact: true }).first().click();
    const stored = await page.evaluate(() =>
      localStorage.getItem('welpco-personalization')
    );
    expect(stored).toContain('"themeMode":"dark"');
  });

  test('saves background selection to storage', async ({ page }) => {
    await openAppearanceTab(page);
    await selectBackground(page, 'blue-ocean');
    const stored = await page.evaluate(() =>
      localStorage.getItem('welpco-personalization')
    );
    expect(stored).toContain('"backgroundId":"blue-ocean"');
  });

  test('persists theme and background after reload', async ({ page }) => {
    await openAppearanceTab(page);
    await page.getByText('Dark', { exact: true }).first().click();
    await selectBackground(page, 'blue-ocean');
    await page.reload({ waitUntil: 'load' });

    const stored = await page.evaluate(() =>
      localStorage.getItem('welpco-personalization')
    );
    expect(stored).toContain('"themeMode":"dark"');
    expect(stored).toContain('"backgroundId":"blue-ocean"');
  });
});
