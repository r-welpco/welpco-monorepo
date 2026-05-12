import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/modules/content/content.service';

describe('BFF Content (e2e)', () => {
  let app: INestApplication;
  const mockContentService = {
    getCategories: jest.fn(),
    getCategory: jest.fn(),
    getCategoriesByParent: jest.fn(),
    getQuestions: jest.fn(),
    getQuestion: jest.fn(),
    getServiceQuestions: jest.fn(),
    getStaticContent: jest.fn(),
    getStaticContentByType: jest.fn(),
    getHolidays: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContentService)
      .useValue(mockContentService)
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

  describe('GET /api/content/service-questions/:serviceCategoryId', () => {
    it('should return service questions for category (booking wizard)', () => {
      const categoryId = 'cat-babysitter';
      const serviceQuestions = [
        {
          id: 'sq1',
          serviceCategoryId: categoryId,
          questionId: 'q1',
          displayOrder: 1,
          isRequired: true,
          question: {
            id: 'q1',
            type: 'text',
            label: 'When do you need care?',
            placeholder: 'Date and time',
            helpText: null,
            options: null,
          },
        },
        {
          id: 'sq2',
          serviceCategoryId: categoryId,
          questionId: 'q2',
          displayOrder: 2,
          isRequired: true,
          question: {
            id: 'q2',
            type: 'date',
            label: 'Preferred date',
            placeholder: null,
            helpText: null,
            options: null,
          },
        },
      ];
      mockContentService.getServiceQuestions.mockResolvedValueOnce(serviceQuestions);

      return request(app.getHttpServer())
        .get(`/api/content/service-questions/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(mockContentService.getServiceQuestions).toHaveBeenCalledWith(categoryId);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toMatchObject({
            id: 'sq1',
            serviceCategoryId: categoryId,
            questionId: 'q1',
            displayOrder: 1,
            isRequired: true,
          });
          expect(res.body[0].question).toMatchObject({
            id: 'q1',
            type: 'text',
            label: 'When do you need care?',
          });
          expect(res.body[1].question.label).toBe('Preferred date');
        });
    });

    it('should return empty array when category has no questions', () => {
      const categoryId = 'cat-empty';
      mockContentService.getServiceQuestions.mockResolvedValueOnce([]);

      return request(app.getHttpServer())
        .get(`/api/content/service-questions/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(mockContentService.getServiceQuestions).toHaveBeenCalledWith(categoryId);
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('GET /api/content/categories', () => {
    it('should return categories list (no auth required)', () => {
      const categories = [
        { id: 'c1', name: 'Care', description: 'Care services', parentId: null, isActive: true },
        { id: 'c2', name: 'Pet Care', description: 'Pet services', parentId: null, isActive: true },
      ];
      mockContentService.getCategories.mockResolvedValueOnce(categories);

      return request(app.getHttpServer())
        .get('/api/content/categories')
        .expect(200)
        .expect((res) => {
          expect(mockContentService.getCategories).toHaveBeenCalledWith(false);
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toMatchObject({ id: 'c1', name: 'Care' });
        });
    });
  });
});
