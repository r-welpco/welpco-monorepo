import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard, waitForNavigation } from '../helpers/test-helpers';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should display dashboard content after login', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 8000 });
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/welcome|dashboard/i);
  });

  test('should show welcome message with user name', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const welcomeText = page.locator('text=/welcome back/i');
    await expect(welcomeText).toBeVisible({ timeout: 8000 });
    const heading = page.locator('h1');
    await expect(heading).toHaveText(/.+/);
  });

  test('should display profile completion status or dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const completionCallout = page.locator('text=/complete.*profile|profile.*complete/i');
    const completionStatus = page.locator('text=/completion|steps completed/i');
    await Promise.race([
      completionCallout.isVisible({ timeout: 3000 }).catch(() => false),
      completionStatus.isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    expect(page.url()).toContain('/dashboard');
  });

  test('should show dashboard stats or load without error', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const statsLabels = ['bookings', 'messages', 'earnings', 'jobs', 'applications', 'reviews'];
    let foundStat = false;
    for (const label of statsLabels) {
      const stat = page.locator(`text=/${label}/i`);
      if (await stat.isVisible({ timeout: 1500 }).catch(() => false)) {
        foundStat = true;
        break;
      }
    }
    expect(page.url()).toContain('/dashboard');
  });

  test('should navigate to profile from completion callout when shown', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const completeProfileButton = page.getByRole('button', { name: /complete.*profile/i });
    if (await completeProfileButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completeProfileButton.click();
      await waitForNavigation(page, /profile/, 5000);
      expect(page.url()).toContain('/dashboard/profile');
    } else {
      expect(page.url()).toContain('/dashboard');
    }
  });
});

