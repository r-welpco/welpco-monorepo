# BFF Testing Updates

This document summarizes the testing updates made to the BFF service. The BFF uses **in-process domain modules**; unit tests mock `DomainAuthService`, `CustomerProfileService`, `WelperProfileService`, and domain `UsersService` (findById) instead of HTTP clients.

## Updates Made

### 1. Unit Tests (`src/modules/auth/auth.service.spec.ts`, `profiles.service.spec.ts`, `users.service.spec.ts`)

**Approach:**
- Auth, profiles, and users module specs mock **in-process** dependencies: `DomainAuthService`, `CustomerProfileService`, `WelperProfileService`, and domain `UsersService` (findById).
- No `UserManagementClient` or `ProfileManagementClient` (removed after migration).

**Coverage:**
- All auth service methods have unit tests (login, register, verifyEmail, refresh, resend, reset-password, change-password).
- Tests verify correct domain service calls and error propagation.

### 2. E2E Tests (`test/auth.e2e-spec.ts`, `profiles.e2e-spec.ts`, `users.e2e-spec.ts`)

**Approach:**
- E2E tests override **domain providers** in the test module (`DomainAuthService`, `CustomerProfileService`, `WelperProfileService`, domain `UsersService`) so auth/profile/users routes use mocks and no outbound HTTP or DB is required for those paths.
- E2E requires **PostgreSQL** to be running for the app to boot (see `test/jest-e2e.setup.ts`).
- No nock/TestMicroservicesHelper for auth or profile; domain mocks define success/failure per test.

**Coverage:**
- All auth, profile, and user endpoints have E2E tests with deterministic mocked responses.

## Test Coverage Summary

### Auth / Profiles / Users
- **Unit Tests**: ✅ Service methods covered with in-process mocks
- **E2E Tests**: ✅ All endpoints covered with domain provider overrides

### Test Endpoints Coverage

| Endpoint | Unit Test | E2E Test | Status |
|----------|-----------|----------|--------|
| `POST /api/auth/login` | ✅ | ✅ | Complete |
| `POST /api/auth/register` | ✅ | ✅ | Complete |
| `POST /api/auth/verify-email` | ✅ | ✅ | Complete |
| `POST /api/auth/resend-verification-email` | ✅ | ✅ | Complete |
| `POST /api/auth/refresh` | ✅ | ✅ | Complete |
| `POST /api/auth/reset-password` | ✅ | ⚠️ | Unit only |
| `POST /api/auth/reset-password/confirm` | ✅ | ⚠️ | Unit only |
| `POST /api/auth/change-password` | ✅ | ⚠️ | Unit only |

## Running Tests

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests
```bash
npm run test:all
```

### With Coverage
```bash
npm run test:cov
```

## Test Structure

### Unit Tests
- Location: `src/**/*.spec.ts`
- Pattern: One spec file per service/component
- Mocking: Uses Jest mocks for dependencies

### E2E Tests
- Location: `test/**/*.e2e-spec.ts`
- Pattern: One spec file per module
- Mocking: Uses domain provider overrides (no nock; auth/profile/users routes use in-process mocks)

## Next Steps

### Recommended Additions
1. **E2E Tests for Password Reset**:
   - `POST /api/auth/reset-password`
   - `POST /api/auth/reset-password/confirm`
   - `POST /api/auth/change-password`

2. **Integration Tests**:
   - Test full auth flow (register → verify → login → refresh)
   - Test error scenarios end-to-end

3. **Performance Tests**:
   - Test token refresh rate limiting
   - Test concurrent request handling

## Notes

- All tests follow the testing bible standards
- Tests use consistent naming conventions
- Mock helpers are reusable across test files
- E2E tests require PostgreSQL to be running for the app to boot; auth/profile/users code paths use mocks
