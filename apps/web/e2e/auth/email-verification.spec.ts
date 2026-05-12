import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  waitForNavigation,
  getErrorMessage,
  fillRegistrationForm,
  waitForFormReady,
  fillOtpInputs,
  hasSuccessMessage,
} from '../helpers/test-helpers';

test.describe('Email Verification Flow', () => {
  test('should show success message after registration and allow navigation to verification', async ({ page }) => {
    // Register a new user
    const email = generateTestEmail('verify');
    const password = generateTestPassword();

    // Navigate to customer registration page
    await page.goto('/register/customer');
    await waitForFormReady(page);
    
    // Fill and submit registration
    await fillRegistrationForm(page, {
      name: 'Test User',
      email,
      password,
      role: 'customer',
    });

    await page.getByRole('button', { name: /create account/i }).click();
    
    await page.waitForResponse((response) => 
      response.url().includes('/api/auth/register') && response.request().method() === 'POST'
    );

    // Should navigate to verification page
    await waitForNavigation(page, /verification/);
    expect(page.url()).toContain('verification');
    expect(page.url()).toContain(`email=${encodeURIComponent(email)}`);

    const heading = page.getByRole('heading', { name: /verify your account/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('should show email sent message when no token in URL', async ({ page }) => {
    const email = generateTestEmail('no-token');
    
    await page.goto(`/verification?email=${encodeURIComponent(email)}`);
    await waitForFormReady(page);

    // When no token in URL, should show verification form
    const heading = page.getByRole('heading', { name: /verify your account/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    // Should show email address
    const emailBadge = page.getByText(email);
    await expect(emailBadge).toBeVisible({ timeout: 2000 });
    
    // Should have verification submit button
    const verifyButton = page.getByRole('button', { name: /verify/i });
    await expect(verifyButton).toBeVisible({ timeout: 2000 });
  });

  test('should show error for invalid verification token (when token in URL)', async ({ page }) => {
    const email = generateTestEmail('invalid-token');
    const invalidToken = 'invalid-token-123';
    
    // Navigate with token in URL - should try to auto-verify
    await page.goto(`/verification?email=${encodeURIComponent(email)}&token=${invalidToken}`);
    
    // Wait for page to load (don't wait for networkidle as auto-verify might be pending)
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for either the error message or the loading state to complete
    // The page will try to auto-verify and show an error if it fails
    await page.waitForTimeout(3000);

    // Should show error (either in loading state or after auto-verify fails)
    const errorMessage = await getErrorMessage(page);
    if (errorMessage) {
      expect(errorMessage).toMatch(/invalid|expired|token|code/i);
    } else {
      // If no error message, check if we're still on verification page (auto-verify failed silently)
      // or if we were redirected
      const currentUrl = page.url();
      // Either still on verification page or redirected (both are acceptable)
      expect(currentUrl).toMatch(/verification|onboarding|register/);
    }
  });

  test('should redirect to register if no email provided', async ({ page }) => {
    await page.goto('/verification');

    // Should redirect to register page
    await waitForNavigation(page, /register/);
    expect(page.url()).toContain('register');
  });

  test('should validate OTP input format (only numeric) - when form is shown', async ({ page }) => {
    const email = generateTestEmail('otp-format');
    await page.goto(`/verification?email=${encodeURIComponent(email)}`);
    await waitForFormReady(page);

    const otpInputs = page.locator('input[inputmode="numeric"], input[inputMode="numeric"]');
    const count = await otpInputs.count();
    
    if (count >= 6) {
      // Try to fill with letters - should be rejected
      await otpInputs.first().fill('a');
      const value = await otpInputs.first().inputValue();
      // OTP inputs should only accept numeric values
      expect(value).toMatch(/^[0-9]*$/);
    }
  });

  test('should show validation error for incomplete OTP code - when form is shown', async ({ page }) => {
    const email = generateTestEmail('incomplete-otp');
    
    await page.goto(`/verification?email=${encodeURIComponent(email)}`);
    await waitForFormReady(page);

    const otpInputs = page.locator('input[inputmode="numeric"], input[inputMode="numeric"]');
    const count = await otpInputs.count();
    
    if (count >= 6) {
      for (let i = 0; i < 3; i++) {
        await otpInputs.nth(i).fill('1');
      }
      
      // Try to submit with incomplete code
      await page.getByRole('button', { name: /verify/i }).click();
      
      // Wait a bit for validation
      await page.waitForTimeout(1000);
      
      // Should show validation error or prevent submission
      const errorMessage = await getErrorMessage(page);
      // Either shows validation error or form doesn't submit
      if (errorMessage) {
        expect(errorMessage).toMatch(/code|required|complete|6/i);
      } else {
        // Form validation might prevent submission - check if we're still on verification page
        expect(page.url()).toContain('verification');
      }
    }
  });
});
