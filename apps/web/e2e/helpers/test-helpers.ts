import { Page, expect } from '@playwright/test';

/** Base URL for the app under test (used so goto works in debug when context baseURL may not be set). */
export const getBaseURL = () =>
  process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.BASE_URL || 'http://localhost:8081';

/** Wait for the app server to respond so the first goto in debug mode doesn't land on about:blank. */
async function waitForServer(baseURL: string, maxWaitMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(baseURL, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 304) return;
    } catch {
      // Server not ready, retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * Helper to generate unique email for testing
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Helper to generate strong password for testing
 */
export function generateTestPassword(): string {
  return 'TestPassword123!';
}

/**
 * Helper to wait for form to be ready
 * Waits for page load and form elements to be visible
 */
export async function waitForFormReady(page: Page, formSelector?: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  if (formSelector) {
    await page.waitForSelector(formSelector, { state: 'visible', timeout: 10000 });
  }
}

/**
 * Helper to fill login form using Playwright best practices
 */
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Wait for form to be ready
  await waitForFormReady(page);
  
  // Use getByLabel for semantic selectors (preferred) or fallback to ID
  try {
    await page.getByLabel(/email/i).fill(email);
  } catch {
    await page.fill('#login-email', email);
  }
  
  try {
    await page.getByLabel(/password/i).fill(password);
  } catch {
    await page.fill('#login-password', password);
  }
}

/**
 * Helper to fill registration form using Playwright best practices
 */
export async function fillRegistrationForm(
  page: Page,
  data: {
    name?: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role?: 'customer' | 'welper';
  }
): Promise<void> {
  // Unified wizard: email + password live at `/register` only; role is chosen later.
  void data.role;

  // Wait for form to be ready
  await waitForFormReady(page);
  
  const prefix = data.role === 'welper' ? 'welper' : 'customer';
  
  // Fill name field
  if (data.name) {
    const nameInputByLabel = page.getByLabel(/full name|name/i);
    if (await nameInputByLabel.count() > 0) {
      await nameInputByLabel.first().fill(data.name);
    } else {
      const nameInputById = page.locator(`#${prefix}-name`);
      if (await nameInputById.count() > 0) {
        await nameInputById.first().fill(data.name);
      }
    }
  }
  
  // Fill email field
  try {
    await page.getByLabel(/email/i).fill(data.email);
  } catch {
    await page.fill(`#${prefix}-email`, data.email);
  }
  
  // Fill password field
  try {
    const passwordFields = page.getByLabel(/password/i);
    const count = await passwordFields.count();
    if (count > 0) {
      await passwordFields.first().fill(data.password);
    } else {
      await page.fill(`#${prefix}-password`, data.password);
    }
  } catch {
    await page.fill(`#${prefix}-password`, data.password);
  }
  
  // Fill confirm password field
  const confirmPassword = data.confirmPassword || data.password;
  try {
    const passwordFields = page.getByLabel(/password/i);
    const count = await passwordFields.count();
    if (count > 1) {
      await passwordFields.nth(1).fill(confirmPassword);
    } else {
      await page.fill(`#${prefix}-confirm`, confirmPassword);
    }
  } catch {
    await page.fill(`#${prefix}-confirm`, confirmPassword);
  }
  
  // Accept terms checkbox (different IDs for customer vs welper)
  try {
    await page.getByLabel(/accept.*terms|terms.*conditions|i agree/i).check();
  } catch {
    // Try customer checkbox ID
    const customerCheckbox = page.locator('#accept-terms');
    // Try welper checkbox ID
    const welperCheckbox = page.locator('#accept-terms-welper');
    
    if (await welperCheckbox.count() > 0) {
      await welperCheckbox.check();
    } else if (await customerCheckbox.count() > 0) {
      await customerCheckbox.check();
    }
  }
}

/**
 * Helper to fill OTP inputs for verification
 * Supports both inputMode="numeric" and inputmode="numeric" (case insensitive)
 */
export async function fillOtpInputs(page: Page, code: string): Promise<void> {
  // Try to find OTP inputs by inputMode attribute (case insensitive)
  const otpInputs = page.locator('input[inputmode="numeric"], input[inputMode="numeric"]');
  const count = await otpInputs.count();
  
  if (count >= code.length) {
    // Wait for first input to be visible
    await otpInputs.first().waitFor({ state: 'visible' });
    
    // Fill each input with corresponding digit
    for (let i = 0; i < code.length && i < count; i++) {
      await otpInputs.nth(i).fill(code[i]);
      // Brief delay for focus movement between OTP inputs
      await page.waitForTimeout(50);
    }
  } else {
    // Fallback: try to find a single code input field
    const codeInput = page.locator('input[type="text"], input[type="number"], input[placeholder*="code" i]').first();
    if (await codeInput.count() > 0) {
      await codeInput.fill(code);
    } else {
      throw new Error(`Could not find OTP input fields. Found ${count} inputs with inputMode="numeric"`);
    }
  }
}

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for dashboard URL or dashboard-related elements
    if (
      page.url().includes('/dashboard') ||
      page.url().includes('/register')
    ) {
      return true;
    }
    
    // Check for user menu or dashboard link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.count() > 0 && await dashboardLink.first().isVisible().catch(() => false)) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Helper to wait for navigation
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForURL(
    (url) => {
      const pathname = url.pathname;
      if (typeof urlPattern === 'string') {
        return pathname.includes(urlPattern);
      }
      return urlPattern.test(pathname);
    },
    { timeout }
  );
}

/**
 * Helper to extract error message from page using Playwright best practices
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
  await page.waitForLoadState('domcontentloaded');
  // First, try getByRole('alert') - most semantic (for Callout errors)
  try {
    const alert = page.getByRole('alert').first();
    if (await alert.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await alert.textContent();
      if (text && text.trim()) return text.trim();
    }
  } catch {
    // Continue to other methods
  }
  
  // Check for inline validation errors (red text elements with error messages)
  // These appear as <Text color="red" size="1"> elements below form fields (not labels)
  try {
    // Look for small red text elements (size="1") that are error messages, not labels
    // Labels are typically size="2" and error messages are size="1"
    const errorTextElements = page.locator('[color="red"][size="1"], text[color="red"][size="1"]').filter({
      hasText: /error|invalid|failed|required|incorrect|wrong|already exists|duplicate|taken|match|confirm|same|strength|characters|format|must be|Enter a valid|Name is required|Password must|Passwords must/i
    });
    const count = await errorTextElements.count();
    if (count > 0) {
      // Get the first visible error text
      for (let i = 0; i < count; i++) {
        const element = errorTextElements.nth(i);
        if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
          const text = await element.textContent();
          // Filter out labels (which might have asterisks) and keep only error messages
          // Error messages are typically longer and contain specific error text
          if (text && text.trim() && text.length > 5 && 
              !text.trim().match(/^[*\s]+$/) &&
              !text.trim().match(/^(Email|Password|Full name|Confirm password)[*\s]*$/i)) {
            return text.trim();
          }
        }
      }
    }
    
    // Fallback: Look for any red text that matches error patterns (but exclude common labels)
    const allRedText = page.locator('[color="red"]');
    const allCount = await allRedText.count();
    for (let i = 0; i < allCount; i++) {
      const element = allRedText.nth(i);
      if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = await element.textContent();
        if (text && text.trim() && text.length > 5) {
          // Check if it's an actual error message (not a label)
          const isError = /error|invalid|failed|required|incorrect|wrong|already exists|duplicate|taken|match|confirm|same|strength|characters|format|must be|Enter a valid|Name is required|Password must|Passwords must/i.test(text);
          const isLabel = /^(Email|Password|Full name|Confirm password)[*\s]*$/i.test(text.trim());
          if (isError && !isLabel) {
            return text.trim();
          }
        }
      }
    }
  } catch {
    // Continue to other methods
  }
  
  // Try to find error text using getByText with regex (broader search)
  try {
    const errorText = page.getByText(/error|invalid|failed|required|incorrect|wrong|already exists|duplicate|taken|match|confirm|same|strength|characters|format/i).first();
    if (await errorText.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await errorText.textContent();
      if (text && text.trim() && text.length > 3) {
        return text.trim();
      }
    }
  } catch {
    // Continue to other methods
  }
  
  // Fallback: Check for Callout with error styling
  try {
    const callout = page.locator('[role="alert"], [class*="red"], [style*="red"]').first();
    if (await callout.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await callout.textContent();
      if (text && text.trim()) return text.trim();
    }
  } catch {
    // No error found
  }
  
  return null;
}

/**
 * Helper to check for success message
 */
export async function hasSuccessMessage(page: Page): Promise<boolean> {
  try {
    // Check for success text
    const successText = page.getByText(/success|verified|sent|completed/i).first();
    if (await successText.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true;
    }
  } catch {
    // Continue to other checks
  }
  
  // Check for success styling
  try {
    const successElement = page.locator('[class*="success"], [color="green"]').first();
    if (await successElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true;
    }
  } catch {
    // No success message found
  }
  
  return false;
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Helper to mock API response (for testing error scenarios)
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: {
    status?: number;
    body?: any;
  }
): Promise<void> {
  await page.route(
    (url) => {
      const urlString = url.toString();
      if (typeof urlPattern === 'string') {
        return urlString.includes(urlPattern);
      }
      return urlPattern.test(urlString);
    },
    async (route) => {
      await route.fulfill({
        status: response.status || 200,
        body: JSON.stringify(response.body || {}),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  );
}

/**
 * Helper to switch between tabs in settings or profile pages.
 * Waits for tablist to be visible (Radix Tabs), then finds and clicks the tab by name.
 * @param timeout - Max ms to wait for tab (default 15000 for settings hydration).
 */
export async function switchTab(page: Page, tabName: string, timeout = 15000): Promise<void> {
  await page.getByRole('tablist').waitFor({ state: 'visible', timeout }).catch(() => {});
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await expect(tab.first()).toBeVisible({ timeout });
  await tab.first().click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Helper to wait for form submission to complete
 */
export async function waitForFormSubmission(
  page: Page,
  timeout = 10000
): Promise<void> {
  // Wait for either success message, error message, or navigation
  await Promise.race([
    page.waitForSelector('[role="alert"]', { timeout }),
    page.waitForURL((url) => url.pathname !== page.url(), { timeout }),
    page.waitForResponse((response) => response.status() < 500, { timeout }),
  ]).catch(() => {
    // Ignore timeout - form might have submitted without visible feedback
  });
}

/**
 * Helper to navigate onboarding steps
 */
export async function navigateOnboardingStep(
  page: Page,
  step: 'welcome' | 'profile' | 'preferences' | 'complete'
): Promise<void> {
  // Wait for onboarding page to load
  await page.waitForLoadState('networkidle');
  
  // Find and click the continue/next button
  const continueButton = page.getByRole('button', { 
    name: /continue|next|save|complete|finish/i 
  });
  
  if (await continueButton.count() > 0) {
    await continueButton.first().click();
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Helper to select background color in personalization settings
 */
export async function selectBackground(
  page: Page,
  backgroundId: string
): Promise<void> {
  // Wait for background options to load
  await page.getByText('Background Color').waitFor({ state: 'visible', timeout: 5000 });

  const backgroundNames: Record<string, string> = {
    'default': 'Default Green',
    'blue-ocean': 'Blue Ocean',
    'purple-sunset': 'Purple Sunset',
    'warm-sunrise': 'Warm Sunrise',
    'cool-mint': 'Cool Mint',
    'minimal-gray': 'Minimal Gray',
  };

  const backgroundName = backgroundNames[backgroundId] || backgroundId;
  const backgroundLabel = page.getByText(backgroundName, { exact: true }).first();
  await expect(backgroundLabel).toBeVisible({ timeout: 5000 });
  // Click the label; the card has onClick and wraps the text, so click bubbles
  await backgroundLabel.click();
  await page.waitForLoadState('domcontentloaded');
}

const WELPER_E2E_EMAIL = process.env.TEST_WELPER_EMAIL ?? 'e2e-welper@welpco.com';
const WELPER_E2E_PASSWORD = process.env.TEST_WELPER_PASSWORD ?? 'Welper123!';

/**
 * Helper to login as welper and navigate to dashboard.
 * Uses e2e-welper@welpco.com / Welper123! unless TEST_WELPER_EMAIL / TEST_WELPER_PASSWORD are set.
 * Do not use TEST_USER_EMAIL here—availability tests must run as welper to see the Availability tab.
 */
export async function loginAsWelperAndNavigateToDashboard(page: Page): Promise<void> {
  const email = WELPER_E2E_EMAIL;
  const password = WELPER_E2E_PASSWORD;
  const baseURL = getBaseURL();
  try {
    await waitForServer(baseURL);
    await page.context().clearCookies();
    await page.goto(baseURL + '/', { waitUntil: 'load', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForFormReady(page);
    await fillLoginForm(page, email, password);
    const navigationPromise = page.waitForURL(/dashboard|register/, { timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => null);
    const responsePromise = page.waitForResponse(
      (r) => (r.url().includes('/api/auth/callback/credentials') || r.url().includes('/api/auth/login')) && r.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);
    await page.getByRole('button', { name: /sign in/i }).click();
    await Promise.all([responsePromise, navigationPromise]);
    const currentUrl = page.url();
    if (currentUrl.includes('/register')) {
      throw new Error('E2E welper user redirected to signup wizard. Run pnpm seed:users and use e2e-welper@welpco.com with signupCompleted: true.');
    }
    if (!currentUrl.includes('/dashboard')) {
      await page.goto(baseURL + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      if (!page.url().includes('/dashboard')) {
        throw new Error('Failed to navigate to dashboard after welper login.');
      }
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Target page, context or browser has been closed')) {
      throw new Error('Page was closed during welper login.');
    }
    throw error;
  }
}

/**
 * Helper to login and navigate to dashboard.
 * Expects the E2E test user (e2e-customer@welpco.com) to have onboarding completed;
 * global setup runs `pnpm seed:users` from the monorepo root (BFF seed), which sets onboardingCompleted: true,
 * so dashboard and settings are accessible.
 */
export async function loginAndNavigateToDashboard(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
  const password = process.env.TEST_USER_PASSWORD || 'Customer123!';

  const baseURL = getBaseURL();
  try {
    await waitForServer(baseURL);
    await page.context().clearCookies();
    await page.goto(baseURL + '/', { waitUntil: 'load', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to login page
    await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForFormReady(page);
    await fillLoginForm(page, email, password);
    
    // Set up navigation promise BEFORE clicking
    const navigationPromise = page.waitForURL(/dashboard|register/, { 
      timeout: 15000,
      waitUntil: 'domcontentloaded'
    }).catch(() => null);
    
    const responsePromise = page.waitForResponse((response) => 
      (response.url().includes('/api/auth/callback/credentials') || response.url().includes('/api/auth/login')) &&
      response.request().method() === 'POST'
    , { timeout: 15000 }).catch(() => null);
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const [response] = await Promise.all([responsePromise, navigationPromise]);
    
    // Check if login was successful (200 or 201)
    if (response && response.status() !== 200 && response.status() !== 201) {
      // Login failed - might be rate limited or invalid credentials
      // Try to continue anyway in case it's a transient error
      console.warn(`Login response status: ${response.status()}`);
    }
    
    // Check current URL - might already be on dashboard/onboarding
    let currentUrl = page.url();
    
    // If we're on onboarding, navigate to dashboard
    if (/\/register/.test(currentUrl)) {
      throw new Error(
        'E2E user redirected to signup wizard (session has signupCompleted: false). ' +
          'Use the seeded E2E user: set TEST_USER_EMAIL=e2e-customer@welpco.com in apps/web/.env.test.local (see .env.test.example). ' +
          'Then run seed from monorepo root: pnpm seed:users. ' +
          `Current URL: ${currentUrl}`
      );
    }
    
    // If still not on dashboard, try to navigate
    if (!currentUrl.includes('/dashboard')) {
      try {
        await page.goto(baseURL + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (error) {
        // ignore
      }
      currentUrl = page.url();
      if (/\/register/.test(currentUrl)) {
        throw new Error(
          'E2E user not completed signup. Set TEST_USER_EMAIL=e2e-customer@welpco.com in .env.test.local and run pnpm seed:users from monorepo root. Redirected to: ' +
            currentUrl
        );
      }
      if (!currentUrl.includes('/dashboard')) {
        throw new Error(`Failed to navigate to dashboard. Current URL: ${currentUrl}`);
      }
    }
    
    // Wait for page to be ready
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    } catch {
      // Page might already be loaded
    }
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Target page, context or browser has been closed')) {
      throw new Error('Page was closed during login. This might indicate a navigation error or test timeout.');
    }
    throw error;
  }
}
