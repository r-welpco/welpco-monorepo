import { test, expect } from '@playwright/test';
import { loginAsWelperAndNavigateToDashboard } from '../helpers/test-helpers';

test.describe('Welper dashboard i18n', () => {
  test('shows French greeting when NEXT_LOCALE=fr', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'fr',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await loginAsWelperAndNavigateToDashboard(page);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText(/Bon retour/i);
  });
});
