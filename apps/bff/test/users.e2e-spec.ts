import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService as DomainAuthServiceClass } from '../src/domains/user-management/auth/auth.service';
import { UsersService as DomainUsersService } from '../src/domains/user-management/users/users.service';
import { createE2EDomainMocks } from './helpers/e2e-domain-mocks.helper';
import { TestAuthHelper } from './helpers/test-auth.helper';

describe('BFF Users (e2e)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;
  const mocks = createE2EDomainMocks();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DomainAuthServiceClass)
      .useValue(mocks.domainAuthService)
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

  describe('GET /api/users/me', () => {
    it('should return current user with valid token', () => {
      const token = authHelper.generateAccessToken({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      });
      mocks.domainUsersService.findById.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
        status: 'Active',
        emailVerified: true,
      });

      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'user-1');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('accountType', 'Customer');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('should return 401 with invalid token format', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });
});
