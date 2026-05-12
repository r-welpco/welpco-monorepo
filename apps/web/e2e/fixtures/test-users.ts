/**
 * Test user fixtures for E2E tests
 *
 * These can be used to create test users before running tests
 * or to reference existing test users in the database
 *
 * Default E2E test users from seed data (keeps demo accounts untouched):
 * - E2E Customer: e2e-customer@welpco.com / Customer123!
 * - E2E Welper: e2e-welper@welpco.com / Welper123!
 * Demo accounts (customer@welpco.com, welper@welpco.com) are also seeded.
 */

export interface TestUser {
  email: string;
  password: string;
  accountType: 'CUSTOMER' | 'WELPER';
  emailVerified?: boolean;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';
}

// Default E2E test user credentials (aligned with playwright.config.ts)
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Customer123!';

/**
 * Generate test user data
 */
export function createTestUser(
  prefix: string = 'test',
  accountType: 'CUSTOMER' | 'WELPER' = 'CUSTOMER'
): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    email: `${prefix}-${timestamp}-${random}@example.com`,
    password: 'TestPassword123!',
    accountType,
    emailVerified: false,
    status: 'PENDING',
  };
}

/**
 * Create a test user via API (for setup)
 * This should be called in test setup hooks
 */
export async function createTestUserViaAPI(
  baseUrl: string,
  user: TestUser
): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      accountType: user.accountType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a test user via API (for cleanup)
 * Note: This requires an admin endpoint or direct database access
 */
export async function deleteTestUserViaAPI(
  baseUrl: string,
  email: string,
  accessToken: string
): Promise<void> {
  // This would require an admin endpoint
  // For now, we'll rely on test database cleanup
  console.log(`Test user cleanup for ${email} - implement admin endpoint`);
}

