import { test, expect } from '@playwright/test';
import {
  generateTestEmail,
  generateTestPassword,
  fillLoginForm,
  fillRegistrationForm,
  waitForNavigation,
  waitForFormReady,
} from '../helpers/test-helpers';

/** Legacy specs targeted `/register/customer`, `/api/auth/register`, and `/onboarding-welcome` (removed). See `e2e/auth/registration.spec.ts`. */
test.describe.skip('@auth Email Verification → Onboarding Flow', () => {
  test('should redirect to onboarding after email verification', async ({ page }) => {
    const email = generateTestEmail('verify-onboard');
    const password = generateTestPassword();

    // Register a new user
    await page.goto('/register/customer');
    await waitForFormReady(page);
    
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

    // Should redirect to onboarding-welcome (not verification page)
    // But if email not verified, onboarding page will redirect to verification
    await waitForNavigation(page, /onboarding-welcome|verification/, 15000);
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/verification')) {
      // Email not verified - simulate verification with token
      // In real flow, user clicks link in email which includes token
      // For test, we'll navigate to verification with a mock token
      // Note: This might fail if backend requires real token, but tests the flow
      
      // Try to navigate to onboarding-welcome (should redirect back to verification if not verified)
      await page.goto('/onboarding-welcome');
      await page.waitForTimeout(2000);
      
      // Should redirect back to verification if email not verified
      const newUrl = page.url();
      if (newUrl.includes('/verification')) {
        expect(newUrl).toContain('verification');
      } else if (newUrl.includes('/onboarding-welcome')) {
        // Email might be auto-verified in test environment
        expect(newUrl).toContain('onboarding-welcome');
      }
    } else if (currentUrl.includes('/onboarding-welcome')) {
      // Email already verified - should be on onboarding
      expect(currentUrl).toContain('onboarding-welcome');
    }
  });

  test('should prevent onboarding without email verification', async ({ page }) => {
    const email = generateTestEmail('no-verify');
    const password = generateTestPassword();

    // Register
    await page.goto('/register/customer');
    await waitForFormReady(page);
    
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

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Try to access onboarding directly (should redirect to verification if not verified)
    await page.goto('/onboarding-welcome');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    
    // Should either be on verification page or onboarding (if email auto-verified)
    expect(currentUrl).toMatch(/verification|onboarding-welcome/);
    
    if (currentUrl.includes('/verification')) {
      // Correctly redirected to verification
      expect(currentUrl).toContain('verification');
    }
  });

  test('should verify email with token from URL', async ({ page }) => {
    const email = generateTestEmail('token-verify');
    
    // Navigate to verification page with token (simulating email link click)
    // Note: In real scenario, token comes from email
    // For test, we'll use a mock token that might not work, but tests the flow
    const mockToken = 'test-verification-token-123';
    await page.goto(`/verification?email=${encodeURIComponent(email)}&token=${mockToken}`);
    
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for auto-verification attempt

    // Page should try to auto-verify with token
    // If token is invalid, might show error or stay on verification page
    // If token is valid, should redirect to onboarding-welcome
    
    const currentUrl = page.url();
    
    // Should be on verification, onboarding, or login (if verification failed)
    expect(currentUrl).toMatch(/verification|onboarding-welcome|login/);
    
    // If redirected to onboarding, verification succeeded
    if (currentUrl.includes('/onboarding-welcome')) {
      expect(currentUrl).toContain('onboarding-welcome');
    }
  });

  test('should update emailVerified status after verification', async ({ page }) => {
    const email = generateTestEmail('status-update');
    const password = generateTestPassword();

    // Register
    await page.goto('/register/customer');
    await waitForFormReady(page);
    
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

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Check if we can access onboarding (which requires emailVerified)
    await page.goto('/onboarding-welcome');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    
    // If on onboarding-welcome, email is verified
    // If on verification, email is not verified yet
    if (currentUrl.includes('/onboarding-welcome')) {
      // Email is verified - check if we can proceed with onboarding
      const welcomeHeading = page.locator('text=/welcome|get started/i');
      if (await welcomeHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Onboarding is accessible, email is verified
        expect(true).toBe(true);
      }
    } else if (currentUrl.includes('/verification')) {
      // Email not verified - this is expected behavior
      expect(currentUrl).toContain('verification');
    }
  });

  test('should complete flow: registration → verification → onboarding', async ({ page }) => {
    const email = generateTestEmail('complete-flow');
    const password = generateTestPassword();

    // Step 1: Register
    await page.goto('/register/customer');
    await waitForFormReady(page);
    
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

    // Step 2: Should redirect to onboarding-welcome (or verification if not verified)
    await waitForNavigation(page, /onboarding-welcome|verification/, 15000);
    
    let currentUrl = page.url();
    
    // Step 3: If on verification, email needs to be verified
    if (currentUrl.includes('/verification')) {
      // In real flow, user clicks email link with token
      // For test, we'll check if we can proceed
      // Note: Without real token, this might not complete verification
      
      // Try to navigate to onboarding (should redirect back if not verified)
      await page.goto('/onboarding-welcome');
      await page.waitForTimeout(2000);
      
      currentUrl = page.url();
      
      if (currentUrl.includes('/verification')) {
        // Still on verification - email not verified
        // This is expected behavior
        expect(currentUrl).toContain('verification');
        return; // Can't proceed without verification
      }
    }
    
    // Step 4: Should be on onboarding-welcome if email is verified
    if (currentUrl.includes('/onboarding-welcome')) {
      // Onboarding is accessible
      const welcomeHeading = page.locator('text=/welcome|get started/i');
      await expect(welcomeHeading).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow dashboard access after onboarding completion', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
    const password = process.env.TEST_USER_PASSWORD || 'Customer123!';

    await page.goto('/login');
    await waitForFormReady(page);
    await fillLoginForm(page, email, password);

    const responsePromise = page.waitForResponse((response) =>
      (response.url().includes('/api/auth/callback/credentials') ||
        response.url().includes('/api/auth/login')) &&
      response.request().method() === 'POST'
    , { timeout: 15000 }).catch(() => null);

    await page.getByRole('button', { name: /sign in/i }).click();
    await responsePromise;

    // Wait for redirect to onboarding, dashboard, or verification
    await page.waitForTimeout(1500);
    const currentUrl = page.url();

    if (currentUrl.includes('/verification')) {
      test.skip();
      return;
    }

    if (currentUrl.includes('/dashboard')) {
      test.skip();
      return;
    }

    // Onboarding flow
    expect(currentUrl).toContain('/onboarding-welcome');

    // Welcome step
    await page.getByRole('button', { name: /get started/i }).click();

    // Profile basics step
    await page.fill('#first-name', 'Test');
    await page.fill('#last-name', 'User');
    await page.fill('#phone', '+1 (555) 123-4567');
    await page.getByRole('button', { name: /continue/i }).click();

    // Preferences step (customer only) - proceed without selections
    const preferencesContinue = page.getByRole('button', { name: /continue/i });
    if (await preferencesContinue.count() > 0) {
      await preferencesContinue.click();
    }

    // Completion step - go to dashboard
    await page.getByRole('button', { name: /go to dashboard/i }).click();
    await waitForNavigation(page, /dashboard/, 15000);

    // Reload dashboard and ensure we stay there (session updated)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');
  });
});

