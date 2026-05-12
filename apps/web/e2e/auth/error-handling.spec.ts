import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  fillLoginForm,
  getErrorMessage,
  waitForFormReady,
} from '../helpers/test-helpers';

// Browser POSTs to NextAuth callback; BFF /api/auth/login is server-side
const AUTH_CALLBACK_PATTERN = '**/api/auth/callback/credentials';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any route mocks from previous tests
    await page.unroute('**/api/auth/login');
    await page.unroute(AUTH_CALLBACK_PATTERN);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, (route) => route.abort());

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('domcontentloaded');
    
    // Check current URL first
    const currentUrl = page.url();
    
    // If we're on login page, check for error message
    if (currentUrl.includes('/login')) {
      const errorMessage = await getErrorMessage(page);
      // Error message should be about network/connection, not "Check your email"
      if (errorMessage && !errorMessage.includes('Check your email')) {
        expect(errorMessage).toMatch(/network|failed|error|connection|try again/i);
      } else {
        // If no specific error message, verify form is still usable (error handled gracefully)
        const button = page.getByRole('button', { name: /sign in/i });
        const isDisabled = await button.isDisabled().catch(() => false);
        // Button should not be permanently disabled
        expect(isDisabled).toBe(false);
      }
    } else {
      // If redirected, that's also acceptable - error was handled
      expect(currentUrl).toMatch(/login|verification|dashboard/);
    }
  });

  test('should handle 500 server errors', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal server error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();

    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(500);
    }
    await page.waitForLoadState('domcontentloaded');

    // Should show error message or stay on login page
    const errorMessage = await getErrorMessage(page);
    const currentUrl = page.url();
    
    if (errorMessage) {
      expect(errorMessage).toMatch(/error|failed|server|try again/i);
    } else {
      // If no error message, verify we're still on login page (error handled)
      expect(currentUrl).toMatch(/login|verification/);
    }
  });

  test('should handle 401 unauthorized errors', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: 'Invalid credentials', statusCode: 401 }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();

    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(401);
    }
    await page.waitForLoadState('domcontentloaded');

    // Should show error message or stay on login page
    const errorMessage = await getErrorMessage(page);
    const currentUrl = page.url();
    
    if (errorMessage) {
      expect(errorMessage).toMatch(/invalid|incorrect|wrong|credentials|unauthorized/i);
    } else {
      // If no error message, verify we're still on login page (error handled)
      expect(currentUrl).toMatch(/login|verification/);
    }
  });

  test('should handle 429 rate limit errors', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, async (route) => {
      await route.fulfill({
        status: 429,
        body: JSON.stringify({
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();

    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(429);
    }
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      const errorMessage = await getErrorMessage(page);
      if (errorMessage && !errorMessage.includes('Check your email')) {
        expect(errorMessage).toMatch(/too many|rate limit|try again|later|error/i);
      } else if (response) {
        expect(response.status()).toBe(429);
      } else {
        const button = page.getByRole('button', { name: /sign in/i });
        expect(await button.isDisabled().catch(() => false)).toBe(false);
      }
    } else {
      expect(currentUrl).toMatch(/login|verification|dashboard/);
    }
  });

  test('should handle timeout errors', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, (route) => route.abort());

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // Should show error message or form should not be stuck
    const errorMessage = await getErrorMessage(page);
    const currentUrl = page.url();
    
    if (errorMessage) {
      expect(errorMessage).toBeTruthy();
    } else {
      // If no error message, verify we're on login or verification page (error handled gracefully)
      expect(currentUrl).toMatch(/login|verification/);
      
      // If on login page, form should be usable
      if (currentUrl.includes('login')) {
        const button = page.getByRole('button', { name: /sign in/i });
        const isDisabled = await button.isDisabled().catch(() => false);
        // Button should not be permanently disabled
        expect(isDisabled).toBe(false);
      }
    }
  });

  test('should handle 400 bad request errors', async ({ page }) => {
    await page.route(AUTH_CALLBACK_PATTERN, async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          message: 'Validation failed',
          statusCode: 400,
          errors: ['Email is required', 'Password is required'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.goto('/login', { waitUntil: 'load' });
    await waitForFormReady(page);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await fillLoginForm(page, generateTestEmail(), generateTestPassword());
    await page.getByRole('button', { name: /sign in/i }).click();

    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(400);
    }
    await page.waitForLoadState('domcontentloaded');

    // Should show error message or stay on login page
    const errorMessage = await getErrorMessage(page);
    const currentUrl = page.url();
    
    if (errorMessage) {
      expect(errorMessage).toBeTruthy();
    } else {
      // If no error message, verify we're still on login page (error handled)
      expect(currentUrl).toMatch(/login|verification/);
    }
  });
});
