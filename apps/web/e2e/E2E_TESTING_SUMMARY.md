# E2E Testing Summary

## Overview

Comprehensive end-to-end testing suite for the Welpco web application authentication flows using Playwright.

## Test Coverage

### ✅ Registration Tests (`e2e/auth/registration.spec.ts`)
- Customer registration with valid data
- Welper registration with valid data
- Duplicate email validation
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- Email format validation
- Password confirmation matching
- Referral code handling

### ✅ Login Tests (`e2e/auth/login.spec.ts`)
- Successful login with valid credentials
- Invalid credentials error handling
- Empty field validation (email, password)
- Account lockout after 5 failed attempts
- Redirect to dashboard after successful login
- Navigation to registration page
- Navigation to forgot password page

### ✅ Email Verification Tests (`e2e/auth/email-verification.spec.ts`)
- Redirect to verification page after registration
- Verify email with valid token
- Error handling for invalid/expired token
- Resend verification email functionality
- Redirect to register if no email provided

### ✅ Password Reset Tests (`e2e/auth/password-reset.spec.ts`)
- Request password reset with valid email
- Email format validation
- Rate limiting handling (429 errors)
- Confirm password reset with valid token
- Invalid token error handling
- Password strength validation on reset
- Navigation back to login

### ✅ Protected Routes Tests (`e2e/auth/protected-routes.spec.ts`)
- Redirect to login when accessing dashboard without auth
- Allow access to dashboard after login
- Protect profile, settings, bookings pages
- Allow access to public routes (/, /register, /login)
- Maintain session across page navigations

### ✅ Error Handling Tests (`e2e/auth/error-handling.spec.ts`)
- Network errors (aborted requests)
- Server errors (500)
- Rate limiting (429)
- Account suspended (401)
- Account deactivated (401)
- Email not verified (401)
- Form validation errors
- Timeout handling

## Test Infrastructure

### Configuration
- **Framework**: Playwright
- **Config File**: `playwright.config.ts`
- **Test Directory**: `e2e/`
- **Helpers**: `e2e/helpers/test-helpers.ts`
- **Fixtures**: `e2e/fixtures/test-users.ts`

### Features
- Automatic dev server startup
- Multiple browser support (Chromium, Firefox, WebKit)
- Screenshot on failure
- Video recording on failure
- Trace collection for debugging
- HTML report generation
- Global setup/teardown hooks

## Running Tests

### Prerequisites
1. Install dependencies: `pnpm install`
2. Install Playwright browsers: `pnpm exec playwright install`
3. Start the single BFF backend: `pnpm dev --filter @welpco/bff` (or from monorepo root: `pnpm dev:services`)
4. Start frontend dev server (or let Playwright start it automatically)
5. Optional: seed test data with `pnpm seed:users` from monorepo root (global setup also runs this if the backend is available)

### Commands
```bash
# Run all tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e auth/login.spec.ts

# Run specific test
pnpm test:e2e -g "should login successfully"
```

## Environment Variables

Set these for testing:

```bash
# Base URL for the web app (default: http://localhost:3000)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# BFF API URL (default: http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Test user credentials (for login tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## Test Helpers

### Available Helper Functions

- `generateTestEmail(prefix?)` - Generate unique test email
- `generateTestPassword()` - Generate strong test password
- `fillLoginForm(page, email, password)` - Fill login form
- `fillRegistrationForm(page, data)` - Fill registration form
- `waitForApiResponse(page, urlPattern, timeout?)` - Wait for API response
- `waitForNavigation(page, urlPattern, timeout?)` - Wait for navigation
- `isLoggedIn(page)` - Check if user is logged in
- `getErrorMessage(page)` - Extract error message from page
- `hasSuccessMessage(page)` - Check for success message
- `mockApiResponse(page, urlPattern, response)` - Mock API response

## Important Notes

1. **Test Data**: Tests use dynamically generated emails to avoid conflicts
2. **Backend Dependency**: Most tests require the backend to be running
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Cleanup**: Test data cleanup should be handled by test database or admin endpoints
5. **Flakiness**: Tests include proper waits and timeouts to reduce flakiness

## CI/CD Integration

Tests are configured for CI environments:
- Automatic retries on failure (2 retries in CI)
- Single worker in CI (sequential execution)
- HTML report generation
- Screenshot and video on failure
- Trace collection for debugging

## Future Enhancements

- [ ] Add test fixtures for creating test users
- [ ] Add database cleanup utilities
- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Add accessibility testing
- [ ] Add mobile viewport tests
- [ ] Add cross-browser compatibility tests

