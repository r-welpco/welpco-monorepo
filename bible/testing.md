# Testing Bible — Welpco

> **Version**: 2.0.0 · **Updated**: 2026-03
> **Audience**: AI agents and developers writing tests for the BFF and web app

---

## 1. Philosophy

- Test **critical user paths** (login, registration, profile, booking), not framework internals.
- Arrange-Act-Assert in every test. One behavior per test.
- Name tests: `should {action} when {condition}`.
- Fast feedback — unit tests must run in seconds, E2E in under a minute.

---

## 2. BFF Unit Tests

**Location**: `apps/bff/src/**/*.spec.ts` (co-located with source)

### Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('SomeService', () => {
  let service: SomeService;
  let repo: jest.Mocked<Repository<SomeEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SomeService,
        {
          provide: getRepositoryToken(SomeEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SomeService);
    repo = module.get(getRepositoryToken(SomeEntity));
  });

  afterEach(() => jest.clearAllMocks());

  it('should return entity when found', async () => {
    const mock = { id: '00000000-0000-0000-0000-000000000001', name: 'test' };
    repo.findOne.mockResolvedValue(mock as any);

    const result = await service.findById(mock.id);

    expect(result).toEqual(mock);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: mock.id } });
  });
});
```

### Rules

- Mock all repositories with `getRepositoryToken()` + `useValue`.
- Mock `EventPublisherService` — it's a no-op wrapper (Kafka was removed). `{ publish: jest.fn() }` is sufficient.
- Mock `JwtService`, `ConfigService`, and any external service.
- Use proper UUIDs: `'00000000-0000-0000-0000-000000000001'`, not `'user-1'`.
- `afterEach(() => jest.clearAllMocks())` — always.

---

## 3. BFF E2E Tests

**Location**: `apps/bff/test/**/*.e2e-spec.ts`
**Config**: `apps/bff/test/jest-e2e.json`

### Test helpers

**Source**: `apps/bff/test/helpers/`

| Helper | Purpose |
|---|---|
| `test-auth.helper.ts` | `TestAuthHelper` class — generates JWT access/refresh tokens for test users. Uses hardcoded `JWT_SECRET: 'test-secret-key'`. Methods: `generateAccessToken(user)`, `generateRefreshToken(user)`, `generateTokens(user)`. |
| `e2e-domain-mocks.helper.ts` | `createE2EDomainMocks()` — returns a `jest.fn()` mock object for all domain services (auth, customer-profile, welper-profile, availability, users). Designed for `overrideProvider().useValue()`. |
| `test-microservices.helper.ts` | `TestMicroservicesHelper` — static nock-based HTTP mocks. Used for integration-style tests. Methods like `mockLoginSuccess()`, `mockGetCurrentUser()`, etc. |

### E2E setup pattern

```typescript
const mocks = createE2EDomainMocks();

const module = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(DomainAuthService).useValue(mocks.domainAuthService)
  .overrideProvider(CustomerProfileService).useValue(mocks.customerProfileService)
  // ... other overrides
  .compile();

const app = module.createNestApplication();
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
await app.init();
```

### Key points

- **No Kafka mocking needed** — Kafka was fully removed. `EventPublisherService.publish()` is a no-op.
- Use `overrideProvider()` to inject mocks, not nock, for isolated domain tests.
- Nock (`test-microservices.helper.ts`) is available but primarily for legacy integration tests.
- Clear database between tests using `TRUNCATE ... CASCADE` when testing against a real DB.
- Generate auth tokens with `TestAuthHelper` for authenticated endpoints.

---

## 4. Web E2E Tests (Playwright)

**Location**: `apps/web/e2e/`
**Config**: `apps/web/playwright.config.ts`

### Global setup

**Source**: `apps/web/e2e/global-setup.ts`

1. Health-checks the BFF (`/api/health`) and frontend.
2. Runs `pnpm seed:users` to seed test users and profiles.
3. Verifies the seeded E2E user can actually log in.

### Test users

| Role | Email | Password | Env vars |
|---|---|---|---|
| Customer | `e2e-customer@welpco.com` | `Customer123!` | `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` |
| Welper | `e2e-welper@welpco.com` | `Welper123!` | `TEST_WELPER_EMAIL`, `TEST_WELPER_PASSWORD` |

**Base URL**: `http://localhost:8081` (env: `PLAYWRIGHT_TEST_BASE_URL` or `BASE_URL`)

### Test helpers

**Source**: `apps/web/e2e/helpers/test-helpers.ts`

Key functions:

| Function | Purpose |
|---|---|
| `fillLoginForm(page, email, password)` | Fills email/password using `getByLabel` with `#login-email` fallback |
| `fillRegistrationForm(page, data)` | Handles customer/welper role, all fields, terms checkbox |
| `fillOtpInputs(page, code)` | Fills OTP inputs via `input[inputmode="numeric"]` |
| `loginAndNavigateToDashboard(page)` | Full customer login flow |
| `loginAsWelperAndNavigateToDashboard(page)` | Full welper login flow |
| `mockApiResponse(page, urlPattern, response)` | Mock BFF via `page.route()` |
| `waitForApiResponse(page, urlPattern)` | Wait for specific API call |
| `getErrorMessage(page)` | Multi-strategy error detection (role="alert", red text, callout) |
| `switchTab(page, tabName)` | Click Radix Tabs via role selectors |
| `selectBackground(page, backgroundId)` | Maps background IDs to human-readable names |

### Test directories

```
apps/web/e2e/
├── auth/               # Login, registration, verification
├── availability/       # Welper availability management
├── dashboard/          # Dashboard views
├── onboarding/         # Initial setup flow
├── personalization/    # Theme, background, shape
├── profile/            # Profile editing
├── settings/           # Account settings
├── fixtures/           # Test fixtures
├── helpers/            # test-helpers.ts
├── global-setup.ts
└── global-teardown.ts
```

---

## 5. Test Commands

### BFF (`apps/bff/`)

```bash
pnpm test              # Unit tests (src/**/*.spec.ts)
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage
pnpm test:e2e          # E2E tests (test/**/*.e2e-spec.ts)
pnpm test:e2e:watch    # E2E watch mode
pnpm test:all          # Unit + E2E sequentially
```

### Web (`apps/web/`)

```bash
pnpm test:e2e                      # All Playwright tests
pnpm test:e2e:install              # Install Chromium
pnpm test:e2e:auth                 # Auth tests only (--grep @auth)
pnpm test:e2e:profile              # Profile tests
pnpm test:e2e:personalization      # Personalization tests
pnpm test:e2e:ui                   # Interactive Playwright UI
pnpm test:e2e:headed               # Headed browser
pnpm test:e2e:debug                # Debug mode
```

> Chromium is stored locally: `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers`

---

## 6. Test Data

### UUIDs

Always use valid UUIDs in tests:

```typescript
// ✅ Correct
const userId = '00000000-0000-0000-0000-000000000001';

// ❌ Wrong
const userId = 'user-1';
```

### Factory helpers

Create reusable test data factories:

```typescript
function createTestUser(overrides?: Partial<UserAccount>): UserAccount {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    accountType: AccountType.CUSTOMER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    ...overrides,
  };
}
```

### Sensitive data

- Test secrets go in `.env.test`, never hardcoded in specs.
- Exception: `TestAuthHelper` uses `'test-secret-key'` by convention.
- Never commit real credentials.
