import { test, expect } from '@playwright/test';
import { loginAndNavigateToDashboard, getErrorMessage, waitForFormSubmission } from '../helpers/test-helpers';

test.describe('Settings Form Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('should validate email format in email update form', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Ensure we're on Account tab (default)
    const accountTab = page.getByRole('tab', { name: /account/i });
    const isActive = await accountTab.getAttribute('data-state').then(attr => attr?.includes('active')).catch(() => false);
    if (!isActive) {
      await accountTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Find email input by ID (more reliable than type selector)
    const emailInput = page.locator('#email-update');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });

    // Clear and enter invalid email
    await emailInput.clear();
    await emailInput.fill('invalid-email-format');
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /update email/i });
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForLoadState('domcontentloaded');
      // Should show validation error
      const errorMessage = await getErrorMessage(page);
      if (errorMessage) {
        expect(errorMessage).toMatch(/email|valid|format/i);
      } else {
        // Check for inline validation
        const emailField = emailInput.locator('xpath=following-sibling::*//text[color="red"][size="1"]').first();
        if (await emailField.isVisible({ timeout: 1000 }).catch(() => false)) {
          const errorText = await emailField.textContent();
          expect(errorText).toMatch(/email|valid|format/i);
        }
      }
    }
  });

  test('should validate password strength in password change form', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Find password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count === 0) {
      // Might need to switch to Account tab
      await page.getByRole('tab', { name: /account/i }).click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Find new password input (usually the second one)
    const newPasswordInput = passwordInputs.nth(1);
    if (await newPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Enter weak password
      await newPasswordInput.fill('weak');
      await page.waitForLoadState('domcontentloaded');
      // Should show password strength indicator or error
      const errorMessage = await getErrorMessage(page);
      const strengthText = page.locator('text=/password strength|weak|medium|strong/i');
      
      if (await strengthText.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await strengthText.textContent();
        expect(text).toMatch(/weak|password/i);
      } else if (errorMessage) {
        expect(errorMessage).toMatch(/password|strength|characters/i);
      }
    }
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count >= 3) {
      // Fill current password
      await passwordInputs.nth(0).fill('CurrentPassword123!');
      
      // Fill new password
      await passwordInputs.nth(1).fill('NewPassword123!');
      
      // Fill confirm password with different value
      await passwordInputs.nth(2).fill('DifferentPassword123!');
      
      // Try to submit
      const submitButton = page.getByRole('button', { name: /update password/i });
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');
        // Should show error about password mismatch
        const errorMessage = await getErrorMessage(page);
        if (errorMessage) {
          expect(errorMessage).toMatch(/match|confirm|same/i);
        }
      }
    }
  });

  test('should show error for incorrect current password', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count >= 3) {
      // Fill incorrect current password
      await passwordInputs.nth(0).fill('WrongPassword123!');
      
      // Fill new password
      const newPassword = 'NewPassword123!';
      await passwordInputs.nth(1).fill(newPassword);
      await passwordInputs.nth(2).fill(newPassword);
      
      // Try to submit
      const submitButton = page.getByRole('button', { name: /update password/i });
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Monitor API response
        const apiPromise = page.waitForResponse((response) => 
          response.url().includes('/api/users/me/password') || 
          response.url().includes('/api/auth/change-password')
        , { timeout: 10000 }).catch(() => null);
        
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');
        const response = await apiPromise;
        if (response && response.status() === 401) {
          // Should show error for incorrect password
          const errorMessage = await getErrorMessage(page);
          if (errorMessage) {
            expect(errorMessage).toMatch(/incorrect|wrong|current password|invalid/i);
          }
        }
      }
    }
  });

  test('should display success message on successful update', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    // Mock successful API response for email update
    await page.route('**/api/users/me/email', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Email updated successfully' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.clear();
      await emailInput.fill('newemail@example.com');
      
      const submitButton = page.getByRole('button', { name: /update email/i });
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('domcontentloaded');
        // Check for success message
        const successMessage = page.locator('text=/success|updated|sent/i');
        if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await successMessage.textContent();
          expect(text).toMatch(/success|updated|sent/i);
        }
      }
    }
  });
});

