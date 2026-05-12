# Environment Variables Setup for E2E Tests

## Overview

Test user credentials are automatically loaded for Playwright E2E tests. You no longer need to pass `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` on the command line.

## Setup Methods (in order of priority)

1. **`.env.test.local` file** (Recommended) - Create this file in `apps/web/` directory
2. **Environment variables** - Pass via command line (overrides file)
3. **Default values** - Set in `playwright.config.ts` (fallback)

## Quick Start

### Option 1: Create `.env.test.local` file (Recommended)

Create a file at `apps/web/.env.test.local`:

```bash
# E2E test user credentials (from seed data; keeps demo accounts untouched)
TEST_USER_EMAIL=e2e-customer@welpco.com
TEST_USER_PASSWORD=Customer123!

# Alternative E2E test user (Welper)
# TEST_USER_EMAIL=e2e-welper@welpco.com
# TEST_USER_PASSWORD=Welper123!
```

This file is gitignored (via `.gitignore`), so you can customize it without committing credentials.

### Option 2: Use defaults

The `playwright.config.ts` already sets default values:
- `TEST_USER_EMAIL=e2e-customer@welpco.com`
- `TEST_USER_PASSWORD=Customer123!`

These match the BFF seed data (e2e-customer, e2e-welper), so tests will work out of the box.

### Option 3: Override via command line

You can still override for a single test run:

```bash
TEST_USER_EMAIL=welper@welpco.com TEST_USER_PASSWORD=Welper123! pnpm test:e2e
```

## Running Tests

Once set up, simply run:

```bash
# Uses credentials from .env.test.local or defaults
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/auth/login.spec.ts

# Run in UI mode
pnpm test:e2e:ui
```

## Available Test Users (from seed data)

Global setup runs `pnpm seed:users` from the **monorepo root** (BFF seed). To run manually: from the monorepo root run `pnpm seed:users`, or from anywhere run `pnpm --filter @welpco/bff seed`. This creates/updates E2E users with **onboarding completed** so they can access dashboard and settings.

### E2E Customer (default for tests)
- **Email**: `e2e-customer@welpco.com`
- **Password**: `Customer123!`
- **Status**: Active, Email Verified, **Onboarding Completed**

### E2E Welper
- **Email**: `e2e-welper@welpco.com`
- **Password**: `Welper123!`
- **Status**: Active, Email Verified, **Onboarding Completed**

## How It Works

The `playwright.config.ts` file:
1. Loads `.env.test.local` if it exists
2. Sets default values if environment variables aren't set
3. Makes these available to all tests via `process.env`

Tests can access credentials using:
```typescript
const email = process.env.TEST_USER_EMAIL || 'e2e-customer@welpco.com';
const password = process.env.TEST_USER_PASSWORD || 'Customer123!';
```

## Troubleshooting

If tests fail with authentication errors:
1. Verify the `.env.test.local` file exists and has correct credentials
2. Check that the backend seed data has been run
3. Ensure the BFF service is running on `http://localhost:3000`
4. Try running with explicit environment variables to debug

