import { test, expect } from '@playwright/test';
import {
  getBaseURL,
  loginAsWelperAndNavigateToDashboard,
  switchTab,
} from '../helpers/test-helpers';

test.describe('Availability (welper)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsWelperAndNavigateToDashboard(page);
  });

  test('Availability tab loads and shows regular schedule', async ({ page }) => {
    await page.goto(getBaseURL() + '/dashboard/profile', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: 'Profile', exact: true })
    ).toBeVisible({ timeout: 15000 });

    await switchTab(page, 'Availability', 15000);

    await expect(
      page.getByRole('heading', { name: /regular schedule/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Add time slots', { exact: true })
    ).toBeVisible();
  });

  test('Adding a time slot persists (PUT succeeds, slot appears)', async ({
    page,
  }) => {
    await page.goto(getBaseURL() + '/dashboard/profile', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: 'Profile', exact: true })
    ).toBeVisible({ timeout: 15000 });
    await switchTab(page, 'Availability', 15000);
    await expect(
      page.getByRole('heading', { name: /regular schedule/i })
    ).toBeVisible({ timeout: 10000 });

    await page.locator('#day-1').check();
    const putResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/api/profiles/me/availability') &&
        r.request().method() === 'PUT',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /add slots/i }).click();

    const res = await putResponse;
    expect(res.status()).toBeLessThan(400);

    await expect(page.getByText('Current time slots')).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByText('Monday').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('Inverted slot (end ≤ start) shows an error and blocks the save (Day 10)', async ({
    page,
  }) => {
    await page.goto(getBaseURL() + '/dashboard/profile', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: 'Profile', exact: true })
    ).toBeVisible({ timeout: 15000 });
    await switchTab(page, 'Availability', 15000);

    await page.locator('#day-2').check(); // Tuesday
    // Type an inverted range: 18:00 → 09:00.
    await page.locator('#start-time-input').fill('18:00');
    await page.locator('#end-time-input').fill('09:00');

    // Capture any PUT to availability — the test fails if the inverted slot
    // got persisted before the bug was fixed.
    let putHappened = false;
    page.on('response', (r) => {
      if (
        r.url().includes('/api/profiles/me/availability') &&
        r.request().method() === 'PUT'
      ) {
        putHappened = true;
      }
    });

    await page.getByRole('button', { name: /add slots/i }).click();

    // The error must be announced via role="alert" so it reaches assistive tech.
    await expect(
      page.getByRole('alert').filter({ hasText: /end time must be after/i })
    ).toBeVisible({ timeout: 3000 });
    expect(putHappened).toBe(false);
  });
});
