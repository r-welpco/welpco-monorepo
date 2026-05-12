import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceQuestionsService } from './service-questions.service';
import { ServiceQuestion } from '../entities/service-question.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { Question } from '../entities/question.entity';
import { QuestionType } from '../entities/question.entity';

describe('ServiceQuestionsService', () => {
  let service: ServiceQuestionsService;
  let serviceQuestionRepo: jest.Mocked<Repository<ServiceQuestion>>;
  let categoryRepo: jest.Mocked<Repository<ServiceCategory>>;
  let questionRepo: jest.Mocked<Repository<Question>>;

  const mockQuestion = {
    id: 'q1',
    type: QuestionType.TEXT,
    label: 'When do you need care?',
    placeholder: 'Date and time',
    helpText: null,
    options: null,
  };

  const mockServiceQuestion = {
    id: 'sq1',
    serviceCategoryId: 'cat-babysitter',
    questionId: 'q1',
    displayOrder: 1,
    isRequired: true,
    conditionalLogic: null,
    question: mockQuestion,
  };

  beforeEach(async () => {
    const mockServiceQuestionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
    const mockCategoryRepo = {
      findOne: jest.fn(),
    };
    const mockQuestionRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceQuestionsService,
        { provide: getRepositoryToken(ServiceQuestion), useValue: mockServiceQuestionRepo },
        { provide: getRepositoryToken(ServiceCategory), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepo },
      ],
    }).compile();

    service = module.get<ServiceQuestionsService>(ServiceQuestionsService);
    serviceQuestionRepo = module.get(getRepositoryToken(ServiceQuestion));
    categoryRepo = module.get(getRepositoryToken(ServiceCategory));
    questionRepo = module.get(getRepositoryToken(Question));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByServiceCategory', () => {
    it('should return questions ordered by displayOrder for booking wizard', async () => {
      const list = [
        { ...mockServiceQuestion, displayOrder: 1 },
        { ...mockServiceQuestion, id: 'sq2', questionId: 'q2', displayOrder: 2, question: { ...mockQuestion, id: 'q2', label: 'Second question' } },
      ];
      (serviceQuestionRepo.find as jest.Mock).mockResolvedValue(list);

      const result = await service.findByServiceCategory('cat-babysitter');
      expect(serviceQuestionRepo.find).toHaveBeenCalledWith({
        where: { serviceCategoryId: 'cat-babysitter' },
        relations: ['question'],
        order: { displayOrder: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].displayOrder).toBe(1);
      expect(result[1].displayOrder).toBe(2);
    });

    it('should return empty array when category has no questions', async () => {
      (serviceQuestionRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findByServiceCategory('cat-empty');
      expect(serviceQuestionRepo.find).toHaveBeenCalledWith({
        where: { serviceCategoryId: 'cat-empty' },
        relations: ['question'],
        order: { displayOrder: 'ASC' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return service question by id with relations', async () => {
      (serviceQuestionRepo.findOne as jest.Mock).mockResolvedValue(mockServiceQuestion);

      const result = await service.findOne('sq1');
      expect(serviceQuestionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sq1' },
        relations: ['question', 'serviceCategory'],
      });
      expect(result).toEqual(mockServiceQuestion);
    });

    it('should throw NotFoundException when not found', async () => {
      (serviceQuestionRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow('Service question with ID nonexistent not found');
    });
  });

  describe('assign', () => {
    it('should create and save new service question when category and question exist', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue({ id: 'cat1' });
      (questionRepo.findOne as jest.Mock).mockResolvedValue({ id: 'q1' });
      (serviceQuestionRepo.findOne as jest.Mock).mockResolvedValue(null);
      const created = { ...mockServiceQuestion, serviceCategoryId: 'cat1', questionId: 'q1' };
      (serviceQuestionRepo.create as jest.Mock).mockReturnValue(created);
      (serviceQuestionRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.assign({
        serviceCategoryId: 'cat1',
        questionId: 'q1',
        displayOrder: 0,
        isRequired: true,
      });
      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cat1' } });
      expect(questionRepo.findOne).toHaveBeenCalledWith({ where: { id: 'q1' } });
      expect(serviceQuestionRepo.save).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException when category not found', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assign({
          serviceCategoryId: 'bad-cat',
          questionId: 'q1',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assign({
          serviceCategoryId: 'bad-cat',
          questionId: 'q1',
        }),
      ).rejects.toThrow('Service category with ID bad-cat not found');
    });

    it('should throw BadRequestException when question not found', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue({ id: 'cat1' });
      (questionRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assign({
          serviceCategoryId: 'cat1',
          questionId: 'bad-q',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assign({
          serviceCategoryId: 'cat1',
          questionId: 'bad-q',
        }),
      ).rejects.toThrow('Question with ID bad-q not found');
    });

    it('should throw BadRequestException when question already assigned to category', async () => {
      (categoryRepo.findOne as jest.Mock).mockResolvedValue({ id: 'cat1' });
      (questionRepo.findOne as jest.Mock).mockResolvedValue({ id: 'q1' });
      (serviceQuestionRepo.findOne as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        service.assign({
          serviceCategoryId: 'cat1',
          questionId: 'q1',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assign({
          serviceCategoryId: 'cat1',
          questionId: 'q1',
        }),
      ).rejects.toThrow('Question is already assigned to this service category');
    });
  });

  describe('remove', () => {
    it('should find and remove service question', async () => {
      (serviceQuestionRepo.findOne as jest.Mock).mockResolvedValue(mockServiceQuestion);
      (serviceQuestionRepo.remove as jest.Mock).mockResolvedValue(undefined);

      await service.remove('sq1');
      expect(serviceQuestionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sq1' },
        relations: ['question', 'serviceCategory'],
      });
      expect(serviceQuestionRepo.remove).toHaveBeenCalledWith(mockServiceQuestion);
    });
  });

  describe('removeByServiceCategory', () => {
    it('should delete all service questions for category', async () => {
      (serviceQuestionRepo.delete as jest.Mock).mockResolvedValue({ affected: 3 });

      await service.removeByServiceCategory('cat1');
      expect(serviceQuestionRepo.delete).toHaveBeenCalledWith({ serviceCategoryId: 'cat1' });
    });
  });
});
