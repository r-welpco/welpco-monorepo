import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ServiceDiscoveryService } from '../src/domains/service-discovery/service-discovery.service';
describe('BFF Service Discovery (e2e)', () => {
  let app: INestApplication;
  const mockServiceDiscoveryService = {
    searchServices: jest.fn(),
    getCategories: jest.fn(),
    getPublicWelperProfile: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ServiceDiscoveryService)
      .useValue(mockServiceDiscoveryService)
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
  }, 15000);

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/search/services', () => {
    it('should return paginated search results (no auth required)', () => {
      mockServiceDiscoveryService.searchServices.mockResolvedValueOnce({
        items: [
          {
            welperId: 'w1',
            name: 'Jane Doe',
            title: 'Care',
            location: '—',
            hourlyRate: 25,
            categories: ['Care'],
            rating: 0,
            reviewCount: 0,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      return request(app.getHttpServer())
        .get('/api/search/services')
        .query({ page: 1, limit: 20 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total', 1);
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 20);
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.items[0]).toMatchObject({
            welperId: 'w1',
            name: 'Jane Doe',
            title: 'Care',
            hourlyRate: 25,
          });
        });
    });

    it('should pass query params to search', () => {
      mockServiceDiscoveryService.searchServices.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      return request(app.getHttpServer())
        .get('/api/search/services')
        .query({ q: 'babysit', categoryId: 'cat-1', page: 2, limit: 10, sort: 'price' })
        .expect(200)
        .then(() => {
          expect(mockServiceDiscoveryService.searchServices).toHaveBeenCalledWith(
            expect.objectContaining({
              q: 'babysit',
              categoryId: 'cat-1',
              page: 2,
              limit: 10,
              sort: 'price',
            }),
          );
        });
    });
  });

  describe('GET /api/search/categories', () => {
    // Wave 2 (BFF): documented public endpoint — confirms the marketing-site
    // category-card deep-link contract: id + name + parentId + displayOrder,
    // returned without any JWT.
    it('returns the categories catalog without auth (Wave 2: marketing site uses ?categoryId=…)', () => {
      const categories = [
        { id: 'c1', name: 'Care', description: 'Care services', parentId: null, displayOrder: 1 },
      ];
      mockServiceDiscoveryService.getCategories.mockResolvedValueOnce(categories);

      return request(app.getHttpServer())
        .get('/api/search/categories')
        // No Authorization header — explicitly anonymous.
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toMatchObject({
            id: 'c1',
            name: 'Care',
            parentId: null,
            displayOrder: 1,
          });
        });
    });
  });

  describe('GET /api/search/welpers/:welperId', () => {
    it('should return public welper profile with Wave 1 trust signals (no auth required)', () => {
      const profile = {
        id: 'prof-1',
        welperId: 'w1',
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Experienced sitter',
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaInfo: {
          city: 'Toronto',
          province: 'ON',
          country: 'CA',
          postalCodes: ['M5V', 'M5W'],
        },
        verified: true,
        averageRating: 4.92,
        reviewCount: 12,
        responseTimeMinutes: 23,
        serviceOfferings: [
          {
            id: 'off-1',
            serviceCategoryId: 'cat1',
            categoryName: 'Care',
            serviceDescription: 'Babysitting',
            hourlyRate: 25,
            experienceYears: 2,
          },
        ],
      };
      mockServiceDiscoveryService.getPublicWelperProfile.mockResolvedValueOnce(profile);

      return request(app.getHttpServer())
        .get('/api/search/welpers/w1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            welperId: 'w1',
            firstName: 'Jane',
            lastName: 'Doe',
            bio: 'Experienced sitter',
            verified: true,
            averageRating: 4.92,
            reviewCount: 12,
            responseTimeMinutes: 23,
            serviceAreaInfo: {
              city: 'Toronto',
              province: 'ON',
              country: 'CA',
              postalCodes: ['M5V', 'M5W'],
            },
          });
          expect(res.body).toHaveProperty('serviceOfferings');
          expect(res.body.serviceOfferings).toHaveLength(1);
          expect(res.body.serviceOfferings[0]).toMatchObject({
            categoryName: 'Care',
            hourlyRate: 25,
          });
        });
    });

    it('should return zero-state trust signals when welper has no data', () => {
      // Bible §22.6 contract: verified=false, averageRating=null, reviewCount=0,
      // responseTimeMinutes=null when nothing is known.
      const profile = {
        id: 'prof-1',
        welperId: 'w-empty',
        firstName: 'New',
        lastName: 'Welper',
        bio: null,
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaInfo: null,
        verified: false,
        averageRating: null,
        reviewCount: 0,
        responseTimeMinutes: null,
        serviceOfferings: [],
      };
      mockServiceDiscoveryService.getPublicWelperProfile.mockResolvedValueOnce(profile);

      return request(app.getHttpServer())
        .get('/api/search/welpers/w-empty')
        .expect(200)
        .expect((res) => {
          expect(res.body.verified).toBe(false);
          expect(res.body.averageRating).toBeNull();
          expect(res.body.reviewCount).toBe(0);
          expect(res.body.responseTimeMinutes).toBeNull();
          expect(res.body.serviceAreaInfo).toBeNull();
        });
    });

    it('should return 404 when welper profile not found or not public', () => {
      const { NotFoundException } = require('@nestjs/common');
      mockServiceDiscoveryService.getPublicWelperProfile.mockRejectedValueOnce(
        new NotFoundException('Welper profile not found'),
      );

      return request(app.getHttpServer())
        .get('/api/search/welpers/nonexistent-id')
        .expect(404);
    });
  });
});
