import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Use project-local browser cache so install and test use the same path (fixes
 * "Executable doesn't exist" when cache paths differ between install and test runs).
 */
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(__dirname, '.playwright-browsers');
}

/**
 * Load environment variables from .env.test.local if it exists
 * This allows setting TEST_USER_EMAIL and TEST_USER_PASSWORD without command line
 */
const envPath = path.resolve(__dirname, '.env.test.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value !== undefined) {
        process.env[key] = value;
      }
    }
  });
}

// Set default test user credentials if not already set
if (!process.env.TEST_USER_EMAIL) {
  process.env.TEST_USER_EMAIL = 'e2e-customer@welpco.com';
}
if (!process.env.TEST_USER_PASSWORD) {
  process.env.TEST_USER_PASSWORD = 'Customer123!';
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  /* Timeout for each test */
  timeout: 30000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8081',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'retain-on-failure',
    /* Timeout for individual actions */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Using only chromium for faster tests
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests.
   * For tests that need login (e.g. personalization), also run BFF on port 3000
   * from monorepo root (pnpm dev) and run seed (pnpm seed:users) so profile.onboardingCompleted is true. */
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

