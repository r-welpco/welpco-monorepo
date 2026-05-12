import type { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 * Ensures services are running and test data is seeded
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:8081';
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  console.log('Running global setup...');
  console.log(`Base URL: ${baseURL}`);
  console.log(`API URL: ${apiURL}`);

  // Check if backend is available
  let backendAvailable = false;
  try {
    const healthCheck = await fetch(`${apiURL}/api/health`);
    if (healthCheck.ok) {
      backendAvailable = true;
      console.log('✅ Backend is available');
    } else {
      console.warn('⚠️ Backend health check failed. Some tests may fail.');
    }
  } catch (error) {
    console.warn('⚠️ Backend is not available. Some tests may fail.');
    console.warn('Make sure the backend is running on', apiURL);
  }

  // Check if frontend is available
  try {
    const frontendCheck = await fetch(baseURL);
    if (frontendCheck.ok) {
      console.log('✅ Frontend is available');
    } else {
      console.warn('⚠️ Frontend is not available. Tests may fail.');
    }
  } catch (error) {
    console.warn('⚠️ Frontend is not available. Make sure the dev server is running.');
  }

  // Seed test data if backend is available (single BFF seed: users + profiles)
  if (backendAvailable) {
    try {
      const workspaceRoot = path.resolve(__dirname, '../../..');
      console.log('🌱 Seeding test data (BFF: users + profiles)...');
      execSync('pnpm seed:users', {
        cwd: workspaceRoot,
        stdio: 'pipe',
        env: { ...process.env },
      });
      console.log('✅ Test data seeded');

      // Verify E2E user has onboarding completed (so login returns onboardingCompleted: true in JWT)
      const e2eEmail = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
      const e2ePassword = process.env.TEST_USER_PASSWORD || 'Customer123!';
      try {
        const loginUrl = `${apiURL}/api/auth/login`;
        const loginRes = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: e2eEmail, password: e2ePassword }),
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          console.log('***********************');
          console.log('***********************');
          console.log('login data:', data);
          console.log('***********************');
          console.log('***********************');
          // BFF returns profile.onboardingCompleted (profile domain); fallback to user for backward compat
          const onboarding =
            data?.profile?.onboardingCompleted ?? data?.user?.onboardingCompleted ?? data?.user?.onboarding_completed;
          if (onboarding === true) {
            console.log('✅ E2E user has onboarding completed (login returns onboardingCompleted: true)');
          } else {
            console.warn(
              '⚠️ E2E user onboardingCompleted is not true after seed. Login returned:',
              onboarding,
              '(profile:',
              data?.profile ? Object.keys(data.profile) : 'no profile',
              '; user keys:',
              data?.user ? Object.keys(data.user) : 'no user',
              '). Called:',
              loginUrl
            );
            console.warn(
              '   → Rebuild BFF: pnpm --filter @welpco/bff build, then restart BFF. Ensure BFF runs on',
              apiURL
            );
          }
        }
      } catch (verifyErr) {
        console.warn('⚠️ Could not verify E2E user onboarding after seed:', verifyErr);
      }
    } catch (error) {
      console.warn('⚠️ Failed to seed test data:', error instanceof Error ? error.message : 'Unknown error');
      console.warn('Tests may still run, but some may fail if test users are missing');
    }
  } else {
    console.warn('⚠️ Skipping test data seeding (backend not available)');
  }
}

export default globalSetup;

