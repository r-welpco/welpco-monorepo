import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService as DomainAuthServiceClass } from '../src/domains/user-management/auth/auth.service';
import { CustomerProfileService } from '../src/domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../src/domains/profile-management/welper-profile/welper-profile.service';
import { AvailabilityService } from '../src/domains/profile-management/availability/availability.service';
import { UsersService as DomainUsersService } from '../src/domains/user-management/users/users.service';
import { createE2EDomainMocks } from './helpers/e2e-domain-mocks.helper';
import { TestAuthHelper } from './helpers/test-auth.helper';

describe('BFF Profiles (e2e)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  const mocks = createE2EDomainMocks();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DomainAuthServiceClass)
      .useValue(mocks.domainAuthService)
      .overrideProvider(CustomerProfileService)
      .useValue(mocks.customerProfileService)
      .overrideProvider(WelperProfileService)
      .useValue(mocks.welperProfileService)
      .overrideProvider(AvailabilityService)
      .useValue(mocks.availabilityService)
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

  describe('GET /api/profiles/me', () => {
    it('should return customer profile when user is customer', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'customer-1',
        email: 'customer@example.com',
        accountType: 'Customer',
        stripeDefaultPaymentMethodId: 'pm_test123',
      });
      mocks.customerProfileService.findByCustomerId.mockResolvedValueOnce({
        customerId: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
      });

      return request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('customerId', 'customer-1');
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('hasDefaultPaymentMethod');
          expect(typeof res.body.hasDefaultPaymentMethod).toBe('boolean');
          expect(res.body.hasDefaultPaymentMethod).toBe(true);
        });
    });

    it('should return hasDefaultPaymentMethod false when customer has no default card', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-2',
        email: 'customer2@example.com',
        accountType: 'Customer',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'customer-2',
        email: 'customer2@example.com',
        accountType: 'Customer',
        stripeDefaultPaymentMethodId: null,
      });
      mocks.customerProfileService.findByCustomerId.mockResolvedValueOnce({
        customerId: 'customer-2',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      return request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hasDefaultPaymentMethod).toBe(false);
        });
    });

    it('should return welper profile when user is welper', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      // Wave 1: GET /api/profiles/me hydrates trust signals via findHydratedByWelperId.
      mocks.welperProfileService.findHydratedByWelperId.mockResolvedValueOnce({
        welperId: 'welper-1',
        bio: 'Experienced service provider',
        verified: false,
        averageRating: null,
        reviewCount: 0,
        responseTimeMinutes: null,
        serviceAreaInfo: null,
      });

      return request(app.getHttpServer())
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toBeDefined();
          if (res.body && typeof res.body === 'object' && 'welperId' in res.body) {
            expect(res.body.welperId).toBe('welper-1');
            expect(res.body).toHaveProperty('bio');
            // Wave 1 trust-signal fields are present even at zero-state.
            expect(res.body).toHaveProperty('verified', false);
            expect(res.body).toHaveProperty('averageRating', null);
            expect(res.body).toHaveProperty('reviewCount', 0);
            expect(res.body).toHaveProperty('responseTimeMinutes', null);
            expect(res.body).toHaveProperty('serviceAreaInfo', null);
          }
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/me')
        .expect(401);
    });
  });

  describe('PUT /api/profiles/me/onboarding-complete', () => {
    it('should mark onboarding as complete', () => {
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      });
      mocks.customerProfileService.markOnboardingComplete.mockResolvedValueOnce({
        onboardingCompleted: true,
      });

      return request(app.getHttpServer())
        .put('/api/profiles/me/onboarding-complete')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toBeDefined();
          if (res.body && typeof res.body === 'object' && 'onboardingCompleted' in res.body) {
            expect(res.body.onboardingCompleted).toBe(true);
          }
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put('/api/profiles/me/onboarding-complete')
        .expect(401);
    });
  });

  describe('GET /api/profiles/me/availability', () => {
    it('should return availability schedule for welper', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.availabilityService.findByWelperId.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      } as any);

      return request(app.getHttpServer())
        .get('/api/profiles/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('welperId');
          expect(res.body).toHaveProperty('timeSlots');
          expect(Array.isArray(res.body.timeSlots)).toBe(true);
          expect(res.body).toHaveProperty('recurringPattern');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/me/availability')
        .expect(401);
    });
  });

  describe('PUT /api/profiles/me/availability', () => {
    it('should update availability schedule', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.availabilityService.update.mockResolvedValueOnce([]);

      return request(app.getHttpServer())
        .put('/api/profiles/me/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ timeSlots: [], recurringPattern: 'weekly' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put('/api/profiles/me/availability')
        .send({ timeSlots: [] })
        .expect(401);
    });
  });

  describe('GET /api/profiles/me/availability/exceptions', () => {
    it('should return availability exceptions for welper', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.availabilityService.findExceptionsByWelperId.mockResolvedValueOnce([]);

      return request(app.getHttpServer())
        .get('/api/profiles/me/availability/exceptions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/me/availability/exceptions')
        .expect(401);
    });
  });

  describe('POST /api/profiles/me/availability/exceptions', () => {
    const calendarId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    it('should add availability exception', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      const created = {
        id: 'ex-1',
        calendarId,
        date: new Date('2025-01-31'),
        endDate: null,
        available: false,
        reason: 'Holiday',
        createdAt: new Date(),
      };
      mocks.availabilityService.createException.mockResolvedValueOnce(created as any);

      return request(app.getHttpServer())
        .post('/api/profiles/me/availability/exceptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          calendarId,
          date: '2025-01-31',
          available: false,
          reason: 'Holiday',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('calendarId', calendarId);
          expect(res.body).toHaveProperty('available', false);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/profiles/me/availability/exceptions')
        .send({
          calendarId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          date: '2025-01-31',
          available: false,
        })
        .expect(401);
    });
  });

  describe('DELETE /api/profiles/me/availability/exceptions/:id', () => {
    it('should remove availability exception', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'welper-1',
        email: 'welper@example.com',
        accountType: 'Welper',
      });
      mocks.availabilityService.deleteException.mockResolvedValueOnce(undefined);

      return request(app.getHttpServer())
        .delete('/api/profiles/me/availability/exceptions/ex-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .delete('/api/profiles/me/availability/exceptions/ex-1')
        .expect(401);
    });
  });

  describe('GET /api/profiles/me/preferences', () => {
    it('should return service preferences for customer', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-pref-1',
        email: 'cust@example.com',
        accountType: 'Customer',
      });
      const now = new Date();
      mocks.customerProfileService.getServicePreferencesForCustomer.mockResolvedValueOnce({
        id: 'prof-1',
        customerId: 'customer-pref-1',
        preferredCategories: ['home-cleaning'],
        notifyNewWelpers: true,
        notifyPriceChanges: false,
        notifyAvailability: true,
        createdAt: now,
        updatedAt: now,
      });

      return request(app.getHttpServer())
        .get('/api/profiles/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.customerId).toBe('customer-pref-1');
          expect(res.body.preferredCategories).toEqual(['home-cleaning']);
        });
    });

    it('should return 403 for welper', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-pref-1',
        email: 'w@example.com',
        accountType: 'Welper',
      });

      return request(app.getHttpServer())
        .get('/api/profiles/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/profiles/me/preferences').expect(401);
    });
  });

  describe('PUT /api/profiles/me/preferences', () => {
    it('should update service preferences for customer', () => {
      const token = authHelper.generateAccessToken({
        id: 'customer-pref-2',
        email: 'cust2@example.com',
        accountType: 'Customer',
      });
      const now = new Date();
      mocks.customerProfileService.updateServicePreferences.mockResolvedValueOnce({
        id: 'prof-2',
        customerId: 'customer-pref-2',
        preferredCategories: ['pet-care', 'handyman'],
        notifyNewWelpers: false,
        notifyPriceChanges: true,
        notifyAvailability: false,
        createdAt: now,
        updatedAt: now,
      });

      return request(app.getHttpServer())
        .put('/api/profiles/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          preferredCategories: ['pet-care', 'handyman'],
          notifyNewWelpers: false,
          notifyPriceChanges: true,
          notifyAvailability: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.preferredCategories).toEqual(['pet-care', 'handyman']);
        });
    });

    it('should return 403 for welper', () => {
      const token = authHelper.generateAccessToken({
        id: 'welper-pref-2',
        email: 'w2@example.com',
        accountType: 'Welper',
      });

      return request(app.getHttpServer())
        .put('/api/profiles/me/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferredCategories: ['x'] })
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put('/api/profiles/me/preferences')
        .send({ preferredCategories: ['x'] })
        .expect(401);
    });
  });
});
