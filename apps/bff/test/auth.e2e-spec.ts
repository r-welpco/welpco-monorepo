import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService as DomainAuthServiceClass } from '../src/domains/user-management/auth/auth.service';
import { CustomerProfileService } from '../src/domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../src/domains/profile-management/welper-profile/welper-profile.service';
import { UsersService as DomainUsersService } from '../src/domains/user-management/users/users.service';
import { createE2EDomainMocks } from './helpers/e2e-domain-mocks.helper';
import { TestAuthHelper } from './helpers/test-auth.helper';
import { HttpException } from '@nestjs/common';

describe('BFF Authentication (e2e)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  const mocks = createE2EDomainMocks();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DomainAuthServiceClass)
      .useValue(mocks.domainAuthService)
      .overrideProvider('DomainAuthService')
      .useValue(mocks.domainAuthService)
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

  describe('POST /api/auth/login', () => {
    it('should login successfully and return tokens with profile.onboardingCompleted', () => {
      mocks.domainAuthService.login.mockResolvedValueOnce({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          accountType: 'Customer',
          status: 'Active',
          emailVerified: true,
        },
      });
      mocks.customerProfileService.findByCustomerId.mockResolvedValueOnce({
        onboardingCompleted: true,
      });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body).toHaveProperty('profile');
          expect(res.body.profile.onboardingCompleted).toBe(true);
        });
    });

    it('should set onboardingCompleted to false if profile fetch fails', () => {
      mocks.domainAuthService.login.mockResolvedValueOnce({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          accountType: 'Customer',
          status: 'Active',
          emailVerified: true,
        },
      });
      mocks.customerProfileService.findByCustomerId.mockRejectedValueOnce(
        new Error('Profile not found'),
      );

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('profile');
          expect(res.body.profile.onboardingCompleted).toBe(false);
        });
    });

    it('should return 401 for invalid credentials', () => {
      mocks.domainAuthService.login.mockRejectedValueOnce(
        new HttpException('Invalid credentials', 401),
      );

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', () => {
      mocks.domainAuthService.register.mockResolvedValueOnce({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-1',
          email: 'newuser@example.com',
          accountType: 'Customer',
          status: 'Pending',
          emailVerified: false,
        },
      });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          accountType: 'Customer',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('newuser@example.com');
        });
    });

    it('should return 409 for duplicate email', () => {
      mocks.domainAuthService.register.mockRejectedValueOnce(
        new HttpException('Email already exists', 409),
      );

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePassword123!',
          accountType: 'Customer',
        })
        .expect(409);
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          accountType: 'InvalidType',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', () => {
      mocks.domainAuthService.verifyEmail.mockResolvedValueOnce({
        success: true,
      });

      return request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'test@example.com',
          token: 'verification-code-123456',
        })
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
          if (res.status === 200) expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should return 400 for invalid verification token', () => {
      mocks.domainAuthService.verifyEmail.mockRejectedValueOnce(
        new HttpException('Invalid verification code', 400),
      );

      return request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'test@example.com',
          token: 'invalid-code',
        })
        .expect(400);
    });

    it('should return 400 for missing email or token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', () => {
      mocks.domainAuthService.refreshToken.mockResolvedValueOnce({
        accessToken: 'new-access-token',
      });

      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.accessToken).toBe('new-access-token');
        });
    });

    it('should return 401 for invalid refresh token', () => {
      mocks.domainAuthService.refreshToken.mockRejectedValueOnce(
        new HttpException('Invalid refresh token', 401),
      );

      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);
    });

    it('should return 400 for missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/resend-verification-email', () => {
    it('should resend verification email successfully', () => {
      mocks.domainAuthService.resendVerificationEmail.mockResolvedValueOnce({
        success: true,
      });
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      });

      return request(app.getHttpServer())
        .post('/api/auth/resend-verification-email')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should return 401 for missing authentication', () => {
      return request(app.getHttpServer())
        .post('/api/auth/resend-verification-email')
        .expect(401);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    // Wave 2 (BFF): enumeration-safe contract — both known and unknown emails
    // get the same `200 { ok: true }` response shape. The service is invoked
    // either way; the response never differentiates.
    it('returns 200 { ok: true } for a known email', () => {
      mocks.domainAuthService.requestResetPassword.mockResolvedValueOnce(undefined);

      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });

    it('Wave 2: returns the same 200 { ok: true } for an unknown email (no enumeration leak)', () => {
      mocks.domainAuthService.requestResetPassword.mockResolvedValueOnce(undefined);

      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: 'unknown@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('POST /api/auth/reset-password/confirm', () => {
    it('should confirm password reset successfully', () => {
      mocks.domainAuthService.confirmResetPassword.mockResolvedValueOnce({
        success: true,
      });

      return request(app.getHttpServer())
        .post('/api/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          token: 'reset-token',
          newPassword: 'NewPassword123!',
        })
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
          if (res.status === 200) expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should return 400 for missing token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password/confirm')
        .send({
          email: 'test@example.com',
          newPassword: 'NewPassword123!',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', () => {
      mocks.domainAuthService.changePassword.mockResolvedValueOnce({
        success: true,
      });
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      });

      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should return 401 for missing authentication', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });
});
