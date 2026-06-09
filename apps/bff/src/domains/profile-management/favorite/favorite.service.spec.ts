import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteService } from './favorite.service';
import { FavoriteWelper } from '../entities/favorite-welper.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteRepository: Repository<FavoriteWelper>;
  let customerProfileRepository: Repository<CustomerProfile>;
  let welperProfileRepository: Repository<WelperProfile>;

  const mockFavoriteRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCustomerProfileRepository = {
    findOne: jest.fn(),
  };

  const mockWelperProfileRepository = {
    findOne: jest.fn(),
  };

  const mockEventPublisher = {
    publishFavoriteWelperAdded: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getRepositoryToken(FavoriteWelper),
          useValue: mockFavoriteRepository,
        },
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: mockCustomerProfileRepository,
        },
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepository,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
    favoriteRepository = module.get<Repository<FavoriteWelper>>(
      getRepositoryToken(FavoriteWelper),
    );
    customerProfileRepository = module.get<Repository<CustomerProfile>>(
      getRepositoryToken(CustomerProfile),
    );
    welperProfileRepository = module.get<Repository<WelperProfile>>(
      getRepositoryToken(WelperProfile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCustomerId', () => {
    it('should return paginated favorites', async () => {
      const customerId = 'customer-1';
      const page = 1;
      const limit = 20;
      const data = [
        {
          id: 'favorite-1',
          customerId,
          welperId: 'welper-1',
          notes: 'Great service',
          createdAt: new Date(),
        },
      ];
      const total = 1;

      mockFavoriteRepository.findAndCount.mockResolvedValue([data, total]);

      const result = await service.findByCustomerId(
        customerId,
        customerId,
        page,
        limit,
      );

      expect(result.data).toEqual(data);
      expect(result.total).toBe(total);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBe(1);
      expect(mockFavoriteRepository.findAndCount).toHaveBeenCalledWith({
        where: { customerId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: limit,
      });
    });
  });

  describe('create', () => {
    it('should create a favorite welper', async () => {
      const customerId = 'customer-1';
      const userId = 'customer-1';
      const createDto = {
        welperId: 'welper-1',
        notes: 'Great service provider',
      };

      const customerProfile = { id: 'profile-1', customerId };
      const welperProfile = { id: 'welper-profile-1', welperId: 'welper-1' };
      const savedFavorite = {
        id: 'favorite-1',
        customerId,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerProfileRepository.findOne.mockResolvedValue(customerProfile);
      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      mockFavoriteRepository.create.mockReturnValue(savedFavorite);
      mockFavoriteRepository.save.mockResolvedValue(savedFavorite);

      const result = await service.create(customerId, createDto, userId);

      expect(result).toEqual(savedFavorite);
      expect(mockFavoriteRepository.create).toHaveBeenCalled();
      expect(mockFavoriteRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer profile not found', async () => {
      mockCustomerProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('customer-1', { welperId: 'welper-1' }, 'customer-1'),
      ).rejects.toThrow('Customer profile not found');
    });

    it('should throw NotFoundException if welper profile not found', async () => {
      mockCustomerProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', customerId: 'customer-1' });
      mockWelperProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('customer-1', { welperId: 'non-existent' }, 'customer-1'),
      ).rejects.toThrow('Welper profile not found');
    });

    it('should throw ConflictException if favorite already exists', async () => {
      const customerId = 'customer-1';
      const createDto = { welperId: 'welper-1' };

      mockCustomerProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', customerId });
      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'welper-profile-1', welperId: 'welper-1' });
      mockFavoriteRepository.findOne.mockResolvedValue({ id: 'existing-favorite' });

      await expect(service.create(customerId, createDto, customerId)).rejects.toThrow(
        'Welper is already in favorites',
      );
    });

    it('should throw ForbiddenException if creating for another user', async () => {
      mockCustomerProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', customerId: 'customer-1' });
      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'welper-profile-1', welperId: 'welper-1' });
      mockFavoriteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('customer-1', { welperId: 'welper-1' }, 'different-user'),
      ).rejects.toThrow('You can only manage your own favorites');
    });
  });

  describe('remove', () => {
    it('should remove a favorite welper', async () => {
      const customerId = 'customer-1';
      const welperId = 'welper-1';
      const userId = 'customer-1';
      const existingFavorite = {
        id: 'favorite-1',
        customerId,
        welperId,
      };

      mockFavoriteRepository.findOne.mockResolvedValue(existingFavorite);
      mockFavoriteRepository.remove.mockResolvedValue(existingFavorite);

      await service.remove(customerId, welperId, userId);

      expect(mockFavoriteRepository.remove).toHaveBeenCalledWith(existingFavorite);
    });

    it('should throw NotFoundException if favorite not found', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('customer-1', 'welper-1', 'customer-1')).rejects.toThrow(
        'Favorite not found',
      );
    });

    it('should throw ForbiddenException if removing another user favorite', async () => {
      mockFavoriteRepository.findOne.mockResolvedValue({
        id: 'favorite-1',
        customerId: 'customer-1',
        welperId: 'welper-1',
      });

      await expect(service.remove('customer-1', 'welper-1', 'different-user')).rejects.toThrow(
        'You can only remove your own favorites',
      );
    });
  });

  describe('removeByIdOrWelperId', () => {
    it('should remove by favorite row id when it matches customer', async () => {
      const fav = { id: 'fav-uuid', customerId: 'c1', welperId: 'w1' };
      mockFavoriteRepository.findOne.mockResolvedValueOnce(fav);
      mockFavoriteRepository.remove.mockResolvedValue(fav);

      await service.removeByIdOrWelperId('c1', 'fav-uuid', 'c1');

      expect(mockFavoriteRepository.remove).toHaveBeenCalledWith(fav);
    });

    it('should remove by welperId when no row matches id', async () => {
      const fav = { id: 'fav-1', customerId: 'c1', welperId: 'w1' };
      mockFavoriteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fav);
      mockFavoriteRepository.remove.mockResolvedValue(fav);

      await service.removeByIdOrWelperId('c1', 'w1', 'c1');

      expect(mockFavoriteRepository.remove).toHaveBeenCalledWith(fav);
    });

    it('should throw NotFound when neither id nor welperId match', async () => {
      mockFavoriteRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(service.removeByIdOrWelperId('c1', 'missing', 'c1')).rejects.toThrow('Favorite not found');
    });
  });
});
