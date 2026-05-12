import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService as DomainAuthServiceClass } from '../src/domains/user-management/auth/auth.service';
import { SignupOrchestratorService } from '../src/domains/user-management/auth/signup-orchestrator.service';
import { CustomerProfileService } from '../src/domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../src/domains/profile-management/welper-profile/welper-profile.service';
import { UsersService as DomainUsersService } from '../src/domains/user-management/users/users.service';
import { createE2EDomainMocks } from './helpers/e2e-domain-mocks.helper';
import { TestAuthHelper } from './helpers/test-auth.helper';
import { SelectedRole } from '../src/domains/user-management/entities/user-account.entity';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * E2E coverage for the unified signup-wizard endpoints (per
 * `SIGNUP_MERGE_PLAN.md` Phase 1 acceptance):
 *  - happy path customer (begin → select-role → identity → notification-prefs
 *    → optional-profile → finish)
 *  - happy path welper (begin → 8 wizard step calls → finish)
 *  - drop-and-resume (begin → 2 steps → state → 2 more → finish)
 *
 * SignupOrchestratorService is overridden so tests don't hit the database.
 * We mock the orchestrator and assert that the controller wires the right
 * methods with the right user.userId. Per-method behaviour is covered by
 * `signup-orchestrator.service.spec.ts`.
 */
describe('BFF Signup wizard (e2e)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  const mocks = createE2EDomainMocks();

  const orchestratorMock = {
    beginSignup: jest.fn(),
    getState: jest.fn(),
    submitSelectRoleStep: jest.fn(),
    submitIdentityStep: jest.fn(),
    submitWelperBioStep: jest.fn(),
    submitWelperServiceAreaStep: jest.fn(),
    submitWelperOfferingStep: jest.fn(),
    submitWelperAvailabilityStep: jest.fn(),
    submitWelperPayoutStep: jest.fn(),
    submitNotificationPrefsStep: jest.fn(),
    submitOptionalProfileStep: jest.fn(),
    finishSignup: jest.fn(),
  };

  const stubState = (overrides: Partial<Record<string, unknown>> = {}) => ({
    userId: 'user-1',
    email: 'jordan@example.com',
    signupCompleted: false,
    emailVerified: false,
    selectedRole: null as SelectedRole | null,
    completedSteps: [],
    nextStep: 'selectRole',
    requiredSteps: ['selectRole'],
    filledData: {},
    ...overrides,
  });

  beforeAll(async () => {
    // domainAuthService.generateTokensFor needs to mint tokens for
    // /signup/begin. The mock helper doesn't include it, so widen here.
    const widenedDomainAuth = {
      ...mocks.domainAuthService,
      generateTokensFor: jest.fn().mockResolvedValue({
        accessToken: 'wizard-access-token',
        refreshToken: 'wizard-refresh-token',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DomainAuthServiceClass)
      .useValue(widenedDomainAuth)
      .overrideProvider('DomainAuthService')
      .useValue(widenedDomainAuth)
      .overrideProvider(SignupOrchestratorService)
      .useValue(orchestratorMock)
      .overrideProvider(CustomerProfileService)
      .useValue(mocks.customerProfileService)
      .overrideProvider(WelperProfileService)
      .useValue(mocks.welperProfileService)
      .overrideProvider(DomainUsersService)
      .useValue(mocks.domainUsersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    authHelper = new TestAuthHelper();
  }, 15000);

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------
  // POST /signup/begin
  // -----------------------------------------------------------------
  describe('POST /api/auth/signup/begin', () => {
    it('returns tokens + state for a fresh email', async () => {
      orchestratorMock.beginSignup.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'jordan@example.com',
          accountType: 'Customer',
        },
        signupState: stubState(),
        isNew: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/signup/begin')
        .send({ email: 'jordan@example.com', password: 'PasswordOk1!' })
        .expect(201);

      expect(res.body.accessToken).toBe('wizard-access-token');
      expect(res.body.refreshToken).toBe('wizard-refresh-token');
      expect(res.body.signupState.nextStep).toBe('selectRole');
    });

    it('rejects 400 on invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup/begin')
        .send({ email: 'not-an-email', password: 'PasswordOk1!' })
        .expect(400);
    });

    it('rejects 400 on too-short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/signup/begin')
        .send({ email: 'jordan@example.com', password: 'short' })
        .expect(400);
    });
  });

  // -----------------------------------------------------------------
  // GET /signup/state (auth-required)
  // -----------------------------------------------------------------
  describe('GET /api/auth/signup/state', () => {
    it('401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/signup/state')
        .expect(401);
    });

    it('returns the orchestrator state for the authenticated user', async () => {
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'jordan@example.com',
      });
      orchestratorMock.getState.mockResolvedValueOnce(stubState());
      const res = await request(app.getHttpServer())
        .get('/api/auth/signup/state')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.userId).toBe('user-1');
      expect(orchestratorMock.getState).toHaveBeenCalledWith('user-1');
    });
  });

  // -----------------------------------------------------------------
  // Customer happy path
  // -----------------------------------------------------------------
  describe('Customer happy path', () => {
    it('walks begin → select-role → identity → notification-prefs → optional-profile → finish', async () => {
      // Begin
      orchestratorMock.beginSignup.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'jordan@example.com',
          accountType: 'Customer',
        },
        signupState: stubState(),
        isNew: true,
      });
      await request(app.getHttpServer())
        .post('/api/auth/signup/begin')
        .send({ email: 'jordan@example.com', password: 'PasswordOk1!' })
        .expect(201);

      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'jordan@example.com',
      });

      // select-role
      orchestratorMock.submitSelectRoleStep.mockResolvedValueOnce(
        stubState({
          selectedRole: SelectedRole.CUSTOMER,
          completedSteps: ['selectRole'],
          nextStep: 'identity',
          requiredSteps: [
            'selectRole',
            'identity',
            'notificationPrefs',
            'optionalProfile',
          ],
        }),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/select-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'customer' })
        .expect(200);

      // identity
      orchestratorMock.submitIdentityStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/identity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jordan',
          lastName: 'Lee',
          phone: '+14165551234',
          dateOfBirth: '1995-06-12',
          tosAcceptedAt: new Date().toISOString(),
          privacyAcceptedAt: new Date().toISOString(),
        })
        .expect(200);

      // notification-prefs
      orchestratorMock.submitNotificationPrefsStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/notification-prefs')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences: [] })
        .expect(200);

      // optional-profile
      orchestratorMock.submitOptionalProfileStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/optional-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      // finish
      orchestratorMock.finishSignup.mockResolvedValueOnce({
        user: { id: 'user-1' },
        signupState: stubState({ signupCompleted: true, nextStep: null }),
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup/finish')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.signupState.signupCompleted).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // Welper happy path
  // -----------------------------------------------------------------
  describe('Welper happy path', () => {
    it('walks all 8 welper-required steps then finish', async () => {
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'jordan@example.com',
        accountType: 'Welper',
      });

      orchestratorMock.submitSelectRoleStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/select-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'welper' })
        .expect(200);

      orchestratorMock.submitIdentityStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/identity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Sam',
          lastName: 'Reed',
          phone: '+14165551234',
          dateOfBirth: '1990-03-04',
          tosAcceptedAt: new Date().toISOString(),
          privacyAcceptedAt: new Date().toISOString(),
        })
        .expect(200);

      orchestratorMock.submitWelperBioStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/welper-bio')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'a'.repeat(125) })
        .expect(200);

      orchestratorMock.submitWelperServiceAreaStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/welper-service-area')
        .set('Authorization', `Bearer ${token}`)
        .send({
          city: 'Toronto',
          province: 'ON',
          country: 'CA',
          postalCodes: ['M5V', 'M5W'],
        })
        .expect(200);

      orchestratorMock.submitWelperOfferingStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/welper-offering')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId: '6b2f2ed6-0f7c-4f09-9f70-2a9b4aaa6f7d',
          title: 'Lawn mowing services',
          hourlyRate: 35,
          description: 'a'.repeat(85),
        })
        .expect(200);

      orchestratorMock.submitWelperAvailabilityStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/welper-availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          weeklySlots: [
            { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
          ],
        })
        .expect(200);

      orchestratorMock.submitWelperPayoutStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/welper-payout')
        .set('Authorization', `Bearer ${token}`)
        .send({ skip: true })
        .expect(200);

      orchestratorMock.submitNotificationPrefsStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/notification-prefs')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences: [] })
        .expect(200);

      orchestratorMock.submitOptionalProfileStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/optional-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      orchestratorMock.finishSignup.mockResolvedValueOnce({
        user: { id: 'user-1' },
        signupState: stubState({
          signupCompleted: true,
          selectedRole: SelectedRole.WELPER,
          nextStep: null,
        }),
      });
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup/finish')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.signupState.signupCompleted).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // Drop and resume
  // -----------------------------------------------------------------
  describe('Drop and resume', () => {
    it('begin → 2 steps → state-check → 2 more → finish', async () => {
      orchestratorMock.beginSignup.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'jordan@example.com',
          accountType: 'Customer',
        },
        signupState: stubState(),
        isNew: true,
      });
      await request(app.getHttpServer())
        .post('/api/auth/signup/begin')
        .send({ email: 'jordan@example.com', password: 'PasswordOk1!' })
        .expect(201);

      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'jordan@example.com',
      });

      orchestratorMock.submitSelectRoleStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/select-role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'customer' })
        .expect(200);

      orchestratorMock.submitIdentityStep.mockResolvedValueOnce(stubState());
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/identity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'A',
          lastName: 'B',
          phone: '+14165551234',
          dateOfBirth: '1990-01-01',
          tosAcceptedAt: new Date().toISOString(),
          privacyAcceptedAt: new Date().toISOString(),
        })
        .expect(200);

      // ... user closes tab, comes back, wizard re-fetches state.
      orchestratorMock.getState.mockResolvedValueOnce(
        stubState({
          selectedRole: SelectedRole.CUSTOMER,
          completedSteps: ['selectRole', 'identity'],
          nextStep: 'notificationPrefs',
        }),
      );
      const stateRes = await request(app.getHttpServer())
        .get('/api/auth/signup/state')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(stateRes.body.nextStep).toBe('notificationPrefs');

      orchestratorMock.submitNotificationPrefsStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/notification-prefs')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences: [] })
        .expect(200);

      orchestratorMock.submitOptionalProfileStep.mockResolvedValueOnce(
        stubState(),
      );
      await request(app.getHttpServer())
        .post('/api/auth/signup/step/optional-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      orchestratorMock.finishSignup.mockResolvedValueOnce({
        user: { id: 'user-1' },
        signupState: stubState({ signupCompleted: true, nextStep: null }),
      });
      await request(app.getHttpServer())
        .post('/api/auth/signup/finish')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
