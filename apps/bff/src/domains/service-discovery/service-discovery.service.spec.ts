import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceDiscoveryService } from './service-discovery.service';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../profile-management/entities/service-offering.entity';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { WelperProfileAggregatesService } from '../profile-management/welper-profile/welper-profile-aggregates.service';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { CategoriesService } from '../content-management/categories/categories.service';
import { GEOCODE_SERVICE } from '../geocode/geocode.interface';
import { ProfileCompletionStatus } from '../profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../profile-management/entities/profile-visibility.enum';
import { DiscoveryCategoriesCacheService } from '../../common/discovery-categories-cache/discovery-categories-cache.service';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { AvailabilityService } from '../profile-management/availability/availability.service';
import { PortfolioService } from '../profile-management/sharing/portfolio.service';
import { HandleService } from '../profile-management/sharing/handle.service';
import { emptyWeeklyAvailabilitySummary } from '../profile-management/availability/dto/weekly-availability-summary.dto';
import { UserAccount, AccountType, AccountStatus } from '../user-management/entities/user-account.entity';

describe('ServiceDiscoveryService', () => {
  let service: ServiceDiscoveryService;
  let welperProfileRepo: Repository<WelperProfile>;
  let serviceOfferingRepo: Repository<ServiceOffering>;
  let welperProfileService: WelperProfileService;
  let serviceOfferingService: ServiceOfferingService;
  let categoriesService: CategoriesService;

  const mockWelperProfileRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockServiceOfferingRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserAccountRepo = {
    findOne: jest.fn(),
  };

  const activeMarketplaceUser = {
    id: 'w1',
    accountType: AccountType.WELPER,
    status: AccountStatus.ACTIVE,
    signupCompleted: true,
    emailVerified: true,
  };

  const mockWelperProfileService = {
    findByWelperId: jest.fn(),
  };

  const mockServiceOfferingService = {
    findByWelperId: jest.fn(),
  };

  const mockCategoriesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByParentId: jest.fn(),
  };

  const mockGeocodeService = {
    reverse: jest.fn(),
    forward: jest.fn(),
  };

  const mockAggregatesService = {
    getAggregates: jest.fn().mockResolvedValue({
      averageRating: null,
      reviewCount: 0,
      responseTimeMinutes: null,
    }),
  };

  const mockDiscoveryCategoriesCache = {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    invalidate: jest.fn(),
  };

  const mockBackgroundCheckService = {
    assertVisibleInSearch: jest.fn().mockResolvedValue(true),
    getBackgroundCheckPassedByUserIds: jest.fn().mockResolvedValue(new Map()),
    hasPassedBackgroundCheck: jest.fn().mockResolvedValue(false),
  };

  const mockAvailabilityService = {
    getWeeklySummariesForWelpers: jest.fn().mockImplementation(async (welperIds: string[]) => {
      const map = new Map<string, ReturnType<typeof emptyWeeklyAvailabilitySummary>>();
      for (const id of welperIds) {
        map.set(id, emptyWeeklyAvailabilitySummary());
      }
      return map;
    }),
  };

  // SHARE-001/002: sharing-module collaborators for the public profile payload.
  const mockPortfolioService = {
    listApprovedPublic: jest.fn().mockResolvedValue([]),
  };

  const mockHandleService = {
    resolveHandleToWelperId: jest.fn().mockResolvedValue(null),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockServiceOfferingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockWelperProfileRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceDiscoveryService,
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepo,
        },
        {
          provide: getRepositoryToken(ServiceOffering),
          useValue: mockServiceOfferingRepo,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserAccountRepo,
        },
        {
          provide: WelperProfileService,
          useValue: mockWelperProfileService,
        },
        {
          provide: WelperProfileAggregatesService,
          useValue: mockAggregatesService,
        },
        {
          provide: ServiceOfferingService,
          useValue: mockServiceOfferingService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: GEOCODE_SERVICE,
          useValue: mockGeocodeService,
        },
        {
          provide: DiscoveryCategoriesCacheService,
          useValue: mockDiscoveryCategoriesCache,
        },
        {
          provide: BackgroundCheckService,
          useValue: mockBackgroundCheckService,
        },
        {
          provide: AvailabilityService,
          useValue: mockAvailabilityService,
        },
        {
          provide: PortfolioService,
          useValue: mockPortfolioService,
        },
        {
          provide: HandleService,
          useValue: mockHandleService,
        },
      ],
    }).compile();

    service = module.get<ServiceDiscoveryService>(ServiceDiscoveryService);
    welperProfileRepo = module.get<Repository<WelperProfile>>(
      getRepositoryToken(WelperProfile),
    );
    serviceOfferingRepo = module.get<Repository<ServiceOffering>>(
      getRepositoryToken(ServiceOffering),
    );
    welperProfileService = module.get<WelperProfileService>(WelperProfileService);
    serviceOfferingService = module.get<ServiceOfferingService>(
      ServiceOfferingService,
    );
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchServices', () => {
    it('should return paginated items when no filters', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { welper_id: 'w1' },
        { welper_id: 'w2' },
      ]);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          firstName: 'Jane',
          lastName: 'Doe',
          bio: null,
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: null,
          provinceCode: null,
          rating: null,
          reviewCount: 0,
          verified: true,
        },
        {
          welperId: 'w2',
          firstName: 'John',
          lastName: 'Smith',
          bio: null,
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: null,
          provinceCode: null,
          rating: null,
          reviewCount: 0,
          verified: false,
        },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([
        { id: 'cat1', name: 'Care' },
      ]);
      mockBackgroundCheckService.getBackgroundCheckPassedByUserIds.mockResolvedValue(
        new Map([
          ['w1', true],
          ['w2', false],
        ]),
      );
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w1', hourlyRate: 25, serviceCategoryId: 'cat1' },
        { welperId: 'w2', hourlyRate: 30, serviceCategoryId: 'cat1' },
      ]);

      const result = await service.searchServices({ page: 1, limit: 20 });

      expect(result).toMatchObject({
        total: 2,
        page: 1,
        limit: 20,
        items: expect.any(Array),
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        welperId: 'w1',
        name: 'Jane D.',
        title: 'Care',
        hourlyRate: 31.25,
        categories: ['Care'],
        verified: true,
        isMinor: false,
      });
      expect(result.items[1]).toMatchObject({
        welperId: 'w2',
        verified: false,
        isMinor: false,
      });
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'u.account_type = :marketplaceWelperType',
        { marketplaceWelperType: AccountType.WELPER },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'u.status = :marketplaceActiveStatus',
        { marketplaceActiveStatus: AccountStatus.ACTIVE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('u.signup_completed = true');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('u.email_verified = true');
    });

    it('should return empty when categoryId has no offerings', async () => {
      // resolveCategoryIds('no-category'): findOne throws, so we fall back to [categoryId]; query returns no matches
      mockCategoriesService.findOne.mockRejectedValue(new NotFoundException('Category not found'));
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.searchServices({
        categoryId: 'no-category',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      expect(mockWelperProfileRepo.find).not.toHaveBeenCalled();
    });

    it('should filter by text q when provided', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ welper_id: 'w1' }]);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          firstName: 'Jane',
          lastName: 'Doe',
          bio: 'Babysitting expert',
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: null,
          provinceCode: null,
          rating: null,
          reviewCount: 0,
        },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'c1', name: 'Care' }]);
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w1', hourlyRate: 25, serviceCategoryId: 'c1' },
      ]);

      const result = await service.searchServices({
        q: 'Jane',
        page: 1,
        limit: 20,
      });

      expect(mockWelperProfileRepo.find).toHaveBeenCalled();
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20, items: expect.any(Array) });
      expect(result.items).toHaveLength(1);
    });

    it('should apply offset pagination and preserve welper order on page 2', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(15);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { welper_id: 'w13' },
        { welper_id: 'w14' },
      ]);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w13',
          firstName: 'Page',
          lastName: 'Two',
          bio: null,
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: null,
          provinceCode: null,
          rating: null,
          reviewCount: 0,
        },
        {
          welperId: 'w14',
          firstName: 'Also',
          lastName: 'Two',
          bio: null,
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: null,
          provinceCode: null,
          rating: null,
          reviewCount: 0,
        },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'cat1', name: 'Care' }]);
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w13', hourlyRate: 20, serviceCategoryId: 'cat1' },
        { welperId: 'w14', hourlyRate: 22, serviceCategoryId: 'cat1' },
      ]);

      const result = await service.searchServices({ page: 2, limit: 12 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(12);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(12);
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('p.welper_id', 'ASC');
      expect(result).toMatchObject({ total: 15, page: 2, limit: 12 });
      expect(result.items.map((item) => item.welperId)).toEqual(['w13', 'w14']);
    });

    it('should throw BadRequest when postalCode is provided but forward geocode fails', async () => {
      mockGeocodeService.forward.mockRejectedValue(new Error('No result for postal code'));

      await expect(
        service.searchServices({
          postalCode: 'INVALID',
          page: 1,
          limit: 20,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.searchServices({
          postalCode: 'INVALID',
          page: 1,
          limit: 20,
        }),
      ).rejects.toThrow('Could not find postal code');
      expect(mockGeocodeService.forward).toHaveBeenCalledWith('INVALID', undefined);
    });
  });

  describe('getCategories', () => {
    it('should return categories from CategoriesService', async () => {
      const categories = [
        { id: '1', name: 'Care', description: 'Care services', parentId: null },
      ];
      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await service.getCategories(false);

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith(false);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: '1', name: 'Care', description: 'Care services', parentId: null });
    });
  });

  describe('getPublicWelperProfile', () => {
    beforeEach(() => {
      mockUserAccountRepo.findOne.mockImplementation(async ({ where }: { where: { id: string } }) => ({
        ...activeMarketplaceUser,
        id: where.id,
      }));
    });

    it('should return profile with offerings when public and complete', async () => {
      const profile = {
        id: 'prof-1',
        welperId: 'w1',
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Bio',
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaCity: null,
        serviceAreaPostalCodes: null,
        countryCode: null,
        provinceCode: null,
        verified: false,
        profileVisibility: ProfileVisibility.PUBLIC,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);
      mockServiceOfferingService.findByWelperId.mockResolvedValue({
        data: [
          {
            id: 'off-1',
            serviceCategoryId: 'cat1',
            serviceDescription: 'Babysitting',
            hourlyRate: 25,
            experienceYears: 2,
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'cat1', name: 'Care', parent: null }]);
      mockBackgroundCheckService.hasPassedBackgroundCheck.mockResolvedValue(false);

      const result = await service.getPublicWelperProfile('w1');

      expect(result).toMatchObject({
        welperId: 'w1',
        displayName: 'Jane D.',
        firstName: 'Jane',
        lastName: null,
        bio: 'Bio',
        // Wave 1 trust-signal zero-state — bible §22.6 honesty contract.
        verified: false,
        isMinor: false,
        averageRating: null,
        reviewCount: 0,
        responseTimeMinutes: null,
        serviceAreaInfo: null,
        serviceOfferings: [
          {
            id: 'off-1',
            serviceCategoryId: 'cat1',
            categoryName: 'Care',
            serviceDescription: 'Babysitting',
            hourlyRate: 31.25,
            experienceYears: 2,
          },
        ],
      });
    });

    it('returns Wave 1 trust signals when the welper has data', async () => {
      const profile = {
        id: 'prof-2',
        welperId: 'w2',
        firstName: 'Sam',
        lastName: 'Lee',
        bio: 'Bio',
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaCity: 'Toronto',
        serviceAreaPostalCodes: ['M5V', 'M5W'],
        countryCode: 'CA',
        provinceCode: 'ON',
        verified: true,
        profileVisibility: ProfileVisibility.PUBLIC,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);
      mockServiceOfferingService.findByWelperId.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockCategoriesService.findAll.mockResolvedValue([]);
      mockAggregatesService.getAggregates.mockResolvedValueOnce({
        averageRating: 4.92,
        reviewCount: 12,
        responseTimeMinutes: 23,
      });
      mockBackgroundCheckService.hasPassedBackgroundCheck.mockResolvedValue(true);

      const result = await service.getPublicWelperProfile('w2');

      expect(result.verified).toBe(true);
      expect(result.averageRating).toBe(4.92);
      expect(result.reviewCount).toBe(12);
      expect(result.responseTimeMinutes).toBe(23);
      expect(result.serviceAreaInfo).toEqual({
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        postalCodes: ['M5V', 'M5W'],
      });
    });

    it('returns isMinor when date of birth indicates under 18', async () => {
      const profile = {
        id: 'prof-3',
        welperId: 'w3',
        firstName: 'Alex',
        lastName: 'Kim',
        bio: 'Bio',
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaCity: null,
        serviceAreaPostalCodes: null,
        countryCode: 'CA',
        provinceCode: 'ON',
        dateOfBirth: new Date('2010-06-01'),
        verified: false,
        profileVisibility: ProfileVisibility.PUBLIC,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);
      mockServiceOfferingService.findByWelperId.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockCategoriesService.findAll.mockResolvedValue([]);
      mockBackgroundCheckService.hasPassedBackgroundCheck.mockResolvedValue(false);

      const result = await service.getPublicWelperProfile('w3');

      expect(result.isMinor).toBe(true);
      expect(result.verified).toBe(false);
    });

    it('should throw NotFound when profile is not public', async () => {
      const profile = {
        id: 'prof-1',
        welperId: 'w1',
        profileVisibility: ProfileVisibility.PRIVATE,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);

      await expect(service.getPublicWelperProfile('w1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPublicWelperProfile('w1')).rejects.toThrow(
        'Welper profile not found',
      );
      expect(mockServiceOfferingService.findByWelperId).toHaveBeenCalledWith('w1', 1, 100, true);
    });

    it('should throw NotFound when profile is not complete', async () => {
      const profile = {
        id: 'prof-1',
        welperId: 'w1',
        profileVisibility: ProfileVisibility.PUBLIC,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);

      await expect(service.getPublicWelperProfile('w1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockServiceOfferingService.findByWelperId).toHaveBeenCalledWith('w1', 1, 100, true);
    });

    it('should throw NotFound when account is deactivated', async () => {
      const profile = {
        id: 'prof-1',
        welperId: 'w1',
        profileVisibility: ProfileVisibility.PUBLIC,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };
      mockWelperProfileService.findByWelperId.mockResolvedValue(profile);
      mockUserAccountRepo.findOne.mockResolvedValue({
        ...activeMarketplaceUser,
        status: AccountStatus.DEACTIVATED,
      });

      await expect(service.getPublicWelperProfile('w1')).rejects.toThrow(NotFoundException);
      expect(mockServiceOfferingService.findByWelperId).toHaveBeenCalledWith('w1', 1, 100, true);
    });

    it('should throw when welper not found', async () => {
      mockWelperProfileService.findByWelperId.mockRejectedValue(
        new NotFoundException('Welper profile not found'),
      );

      await expect(service.getPublicWelperProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchServices - rating filter', () => {
    it('should exclude welpers with NULL ratings when minRating is set', async () => {
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ welper_id: 'w1' }]),
        setParameter: jest.fn().mockReturnThis(),
      };

      mockWelperProfileRepo.createQueryBuilder.mockReturnValue(qb);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          firstName: 'Jane',
          lastName: 'Doe',
          bio: 'Experienced caregiver',
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: 'CA',
          provinceCode: 'QC',
          rating: 4.5,
          reviewCount: 10,
        },
      ]);
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w1', hourlyRate: 25, serviceCategoryId: 'cat1' },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'cat1', name: 'Care' }]);

      await service.searchServices({ minRating: 4 });

      // Verify that andWhere was called with the correct condition
      // The condition should be 'p.rating IS NOT NULL AND p.rating >= :minRating'
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(p.rating IS NOT NULL AND p.rating >= :minRating)',
        { minRating: 4 },
      );
    });

    it('should not apply rating filter when minRating is not provided', async () => {
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { welper_id: 'w1' },
          { welper_id: 'w2' },
        ]),
        setParameter: jest.fn().mockReturnThis(),
      };

      mockWelperProfileRepo.createQueryBuilder.mockReturnValue(qb);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          firstName: 'Jane',
          lastName: 'Doe',
          bio: 'Bio',
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: 'CA',
          provinceCode: 'QC',
          rating: 4.5,
          reviewCount: 10,
        },
        {
          welperId: 'w2',
          firstName: 'John',
          lastName: 'Smith',
          bio: 'Bio',
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: 'CA',
          provinceCode: 'QC',
          rating: null,
          reviewCount: 0,
        },
      ]);
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w1', hourlyRate: 25, serviceCategoryId: 'cat1' },
        { welperId: 'w2', hourlyRate: 30, serviceCategoryId: 'cat1' },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'cat1', name: 'Care' }]);

      const result = await service.searchServices({});

      // Both welpers should be included (one with rating, one without)
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('searchServices - radius filter', () => {
    it('should apply earth_distance filter when radius parameters are provided', async () => {
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ welper_id: 'w1' }]),
        setParameter: jest.fn().mockReturnThis(),
      };

      mockWelperProfileRepo.createQueryBuilder.mockReturnValue(qb);
      mockWelperProfileRepo.find.mockResolvedValue([
        {
          welperId: 'w1',
          firstName: 'Jane',
          lastName: 'Doe',
          bio: 'Bio',
          profilePhotoUrl: null,
          serviceArea: null,
          countryCode: 'CA',
          provinceCode: 'QC',
          rating: null,
          reviewCount: 0,
        },
      ]);
      mockServiceOfferingRepo.find.mockResolvedValue([
        { welperId: 'w1', hourlyRate: 25, serviceCategoryId: 'cat1' },
      ]);
      mockCategoriesService.findAll.mockResolvedValue([{ id: 'cat1', name: 'Care' }]);

      await service.searchServices({
        latitude: 45.5017,
        longitude: -73.5673,
        radiusKm: 10,
      });

      // Verify that radius filter was applied
      const earthDistanceCalls = qb.andWhere.mock.calls.filter(
        (call) => call[0] && call[0].includes('earth_distance'),
      );
      expect(earthDistanceCalls.length).toBeGreaterThan(0);
    });
  });
});
