# E2E Testing for Web App

This directory contains end-to-end tests for the Welpco web application using Playwright.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers (uses project-local `.playwright-browsers`):
```bash
pnpm run test:e2e:install
```

3. For login-dependent tests (personalization, dashboard): run BFF on port 3000 and seed:
```bash
# From monorepo root: pnpm dev (or start BFF), then pnpm seed:users
```

## Running Tests

Use the npm scripts so browsers are found (e.g. `pnpm run test:e2e`, not `pnpm exec playwright test`).

### Run all tests
```bash
pnpm run test:e2e
```

### Run personalization tests
```bash
pnpm run test:e2e:personalization
```

### Run tests in UI mode
```bash
pnpm test:e2e:ui
```

### Run specific test file
```bash
pnpm run test:e2e -- e2e/auth/login.spec.ts
```

### Run tests in headed mode
```bash
pnpm test:e2e --headed
```

### Run tests in debug mode
```bash
pnpm test:e2e --debug
```

## Test Structure

- `e2e/auth/` - Authentication flow tests
  - `registration.spec.ts` - User registration tests
  - `login.spec.ts` - Login flow tests
  - `email-verification.spec.ts` - Email verification tests
  - `password-reset.spec.ts` - Password reset flow tests
  - `protected-routes.spec.ts` - Protected route access tests
  - `error-handling.spec.ts` - Error scenario tests

- `e2e/helpers/` - Test helper utilities
  - `test-helpers.ts` - Common test helper functions

## Environment Variables

Test user credentials are automatically loaded from:
1. `.env.test.local` file (if it exists) - **Recommended for local development**
2. Environment variables passed to the command
3. Default values in `playwright.config.ts` (e2e-customer@welpco.com / Customer123!)

### Quick Setup

Create a `.env.test.local` file in the `apps/web` directory:

```bash
# E2E test user credentials (from seed data)
TEST_USER_EMAIL=e2e-customer@welpco.com
TEST_USER_PASSWORD=Customer123!

# Alternative E2E test user (Welper)
# TEST_USER_EMAIL=e2e-welper@welpco.com
# TEST_USER_PASSWORD=Welper123!
```

The `.env.test.local` file is gitignored, so you can customize it without committing credentials.

### Available Environment Variables

- `TEST_USER_EMAIL` - Test user email for login tests (default: e2e-customer@welpco.com)
- `TEST_USER_PASSWORD` - Test user password for login tests (default: Customer123!)
- `PLAYWRIGHT_TEST_BASE_URL` - Base URL for the app (default: http://localhost:3000)
- `NEXT_PUBLIC_API_URL` - BFF API URL (default: http://localhost:3000)

### Running Tests

Once `.env.test.local` is set up, you can run tests without passing environment variables:

```bash
# All tests will use credentials from .env.test.local
pnpm test:e2e

# Or override for a single run
TEST_USER_EMAIL=e2e-welper@welpco.com TEST_USER_PASSWORD=Welper123! pnpm test:e2e
```

## Test Scenarios Covered

### Registration
- ✅ Customer registration
- ✅ Welper registration
- ✅ Duplicate email validation
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Password confirmation matching
- ✅ Referral code handling

### Login
- ✅ Successful login
- ✅ Invalid credentials
- ✅ Empty fields validation
- ✅ Account lockout after multiple failures
- ✅ Redirect to dashboard after login
- ✅ Navigation to registration/forgot password

### Email Verification
- ✅ Redirect to verification after registration
- ✅ Verify with valid token
- ✅ Error with invalid token
- ✅ Resend verification email

### Password Reset
- ✅ Request password reset
- ✅ Email validation
- ✅ Rate limiting
- ✅ Confirm password reset with token
- ✅ Invalid token handling
- ✅ Password strength validation

### Protected Routes
- ✅ Redirect to login when unauthenticated
- ✅ Access dashboard after login
- ✅ Protect profile, settings, bookings pages
- ✅ Allow public routes
- ✅ Maintain session across navigations

### Error Handling
- ✅ Network errors
- ✅ Server errors (500)
- ✅ Rate limiting (429)
- ✅ Account suspended
- ✅ Account deactivated
- ✅ Email not verified
- ✅ Validation errors
- ✅ Timeout handling

## Writing New Tests

1. Create a new test file in the appropriate directory
2. Import test helpers from `helpers/test-helpers.ts`
3. Use descriptive test names
4. Follow the existing test structure
5. Mock API responses when testing error scenarios

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries on failure
- HTML report generation
- Screenshot on failure
- Trace collection for debugging

