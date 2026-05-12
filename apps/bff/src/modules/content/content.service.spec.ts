import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { CategoriesService } from '../../domains/content-management/categories/categories.service';
import { HolidayService } from '../../domains/content-management/holiday/holiday.service';
import { QuestionsService } from '../../domains/content-management/questions/questions.service';
import { ServiceQuestionsService } from '../../domains/content-management/service-questions/service-questions.service';
import { StaticContentService } from '../../domains/content-management/static-content/static-content.service';

describe('ContentService', () => {
  let service: ContentService;
  let categoriesService: jest.Mocked<CategoriesService>;
  let questionsService: jest.Mocked<QuestionsService>;
  let serviceQuestionsService: jest.Mocked<ServiceQuestionsService>;
  let staticContentService: jest.Mocked<StaticContentService>;
  let holidayService: jest.Mocked<HolidayService>;

  beforeEach(async () => {
    const mockCategoriesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByParentId: jest.fn(),
    };
    const mockHolidayService = {
      findByCountryAndProvince: jest.fn(),
    };
    const mockQuestionsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    const mockServiceQuestionsService = {
      findByServiceCategory: jest.fn(),
    };
    const mockStaticContentService = {
      findAll: jest.fn(),
      findByType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: HolidayService, useValue: mockHolidayService },
        { provide: QuestionsService, useValue: mockQuestionsService },
        { provide: ServiceQuestionsService, useValue: mockServiceQuestionsService },
        { provide: StaticContentService, useValue: mockStaticContentService },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    categoriesService = module.get(CategoriesService) as jest.Mocked<CategoriesService>;
    questionsService = module.get(QuestionsService) as jest.Mocked<QuestionsService>;
    serviceQuestionsService = module.get(ServiceQuestionsService) as jest.Mocked<ServiceQuestionsService>;
    staticContentService = module.get(StaticContentService) as jest.Mocked<StaticContentService>;
    holidayService = module.get(HolidayService) as jest.Mocked<HolidayService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCategories', () => {
    it('should delegate to categoriesService.findAll with includeInactive false by default', async () => {
      const categories = [{ id: 'c1', name: 'Care', parentId: null }];
      (categoriesService.findAll as jest.Mock).mockResolvedValue(categories);

      const result = await service.getCategories();
      expect(categoriesService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(categories);
    });

    it('should pass includeInactive true when requested', async () => {
      (categoriesService.findAll as jest.Mock).mockResolvedValue([]);
      await service.getCategories(true);
      expect(categoriesService.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('getCategory', () => {
    it('should delegate to categoriesService.findOne', async () => {
      const category = { id: 'c1', name: 'Care' };
      (categoriesService.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.getCategory('c1');
      expect(categoriesService.findOne).toHaveBeenCalledWith('c1');
      expect(result).toEqual(category);
    });
  });

  describe('getCategoriesByParent', () => {
    it('should delegate to categoriesService.findByParentId', async () => {
      const categories = [{ id: 'c1', name: 'Child', parentId: 'p1' }];
      (categoriesService.findByParentId as jest.Mock).mockResolvedValue(categories);

      const result = await service.getCategoriesByParent('p1');
      expect(categoriesService.findByParentId).toHaveBeenCalledWith('p1');
      expect(result).toEqual(categories);
    });
  });

  describe('getServiceQuestions', () => {
    it('should return questions for a service category (booking wizard)', async () => {
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
          },
        },
      ];
      (serviceQuestionsService.findByServiceCategory as jest.Mock).mockResolvedValue(serviceQuestions);

      const result = await service.getServiceQuestions(categoryId);
      expect(serviceQuestionsService.findByServiceCategory).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(serviceQuestions);
      expect(result).toHaveLength(1);
      expect(result[0].question.label).toBe('When do you need care?');
    });

    it('should return empty array when category has no questions', async () => {
      (serviceQuestionsService.findByServiceCategory as jest.Mock).mockResolvedValue([]);

      const result = await service.getServiceQuestions('cat-empty');
      expect(serviceQuestionsService.findByServiceCategory).toHaveBeenCalledWith('cat-empty');
      expect(result).toEqual([]);
    });
  });

  describe('getQuestions', () => {
    it('should delegate to questionsService.findAll', async () => {
      const questions = [{ id: 'q1', label: 'Question 1', type: 'text' }];
      (questionsService.findAll as jest.Mock).mockResolvedValue(questions);

      const result = await service.getQuestions();
      expect(questionsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(questions);
    });
  });

  describe('getQuestion', () => {
    it('should delegate to questionsService.findOne', async () => {
      const question = { id: 'q1', label: 'Question 1', type: 'text' };
      (questionsService.findOne as jest.Mock).mockResolvedValue(question);

      const result = await service.getQuestion('q1');
      expect(questionsService.findOne).toHaveBeenCalledWith('q1');
      expect(result).toEqual(question);
    });
  });
});
