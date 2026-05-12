import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { ServiceCategory } from '../entities/service-category.entity';
import { DiscoveryCategoriesCacheService } from '../../../common/discovery-categories-cache/discovery-categories-cache.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<ServiceCategory>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockDiscoveryCategoriesCache = {
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: mockRepository,
        },
        {
          provide: DiscoveryCategoriesCacheService,
          useValue: mockDiscoveryCategoriesCache,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<ServiceCategory>>(
      getRepositoryToken(ServiceCategory),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all categories', async () => {
    const mockCategories = [
      { id: '1', name: 'Care', level: 1 },
      { id: '2', name: 'Pet Care', level: 1 },
    ];
    mockQueryBuilder.getMany.mockResolvedValue(mockCategories);

    const result = await service.findAll();
    expect(result).toEqual(mockCategories);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
  });
});
