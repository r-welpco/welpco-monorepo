import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  // Add any cleanup logic here
  // For example, cleaning up test data, closing connections, etc.
}

export default globalTeardown;

