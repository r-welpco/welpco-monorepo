import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOfferingService } from './service-offering.service';
import { ServiceOffering } from '../entities/service-offering.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ServiceOfferingService', () => {
  let service: ServiceOfferingService;
  let serviceOfferingRepository: Repository<ServiceOffering>;
  let welperProfileRepository: Repository<WelperProfile>;
  let eventPublisher: EventPublisherService;

  const mockServiceOfferingRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockWelperProfileRepository = {
    findOne: jest.fn(),
  };

  const mockEventPublisher = {
    publishServiceOfferingAdded: jest.fn(),
    publishServiceOfferingUpdated: jest.fn(),
    publishServiceOfferingDeleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOfferingService,
        {
          provide: getRepositoryToken(ServiceOffering),
          useValue: mockServiceOfferingRepository,
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

    service = module.get<ServiceOfferingService>(ServiceOfferingService);
    serviceOfferingRepository = module.get<Repository<ServiceOffering>>(
      getRepositoryToken(ServiceOffering),
    );
    welperProfileRepository = module.get<Repository<WelperProfile>>(
      getRepositoryToken(WelperProfile),
    );
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByWelperId', () => {
    it('should return paginated service offerings', async () => {
      const welperId = 'welper-1';
      const page = 1;
      const limit = 20;
      const data = [
        {
          id: 'service-1',
          welperId,
          serviceCategoryId: 'category-1',
          serviceDescription: 'Service 1',
          hourlyRate: 30.0,
          experienceYears: 5,
          active: true,
        },
        {
          id: 'service-2',
          welperId,
          serviceCategoryId: 'category-2',
          serviceDescription: 'Service 2',
          hourlyRate: 35.0,
          experienceYears: 3,
          active: true,
        },
      ];
      const total = 2;

      mockServiceOfferingRepository.findAndCount.mockResolvedValue([data, total]);

      const result = await service.findByWelperId(welperId, page, limit);

      expect(result.data).toEqual(data);
      expect(result.total).toBe(total);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBe(1);
      expect(mockServiceOfferingRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: limit,
      });
    });

    it('should filter by active status', async () => {
      const welperId = 'welper-1';
      const active = true;

      mockServiceOfferingRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByWelperId(welperId, 1, 20, active);

      expect(mockServiceOfferingRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId, active: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by inactive status', async () => {
      const welperId = 'welper-1';
      const active = false;

      mockServiceOfferingRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByWelperId(welperId, 1, 20, active);

      expect(mockServiceOfferingRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId, active: false },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      const welperId = 'welper-1';
      const page = 2;
      const limit = 10;
      const data = [];
      const total = 25;

      mockServiceOfferingRepository.findAndCount.mockResolvedValue([data, total]);

      const result = await service.findByWelperId(welperId, page, limit);

      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
      expect(mockServiceOfferingRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
    });

    it('should use default pagination values', async () => {
      const welperId = 'welper-1';

      mockServiceOfferingRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByWelperId(welperId);

      expect(mockServiceOfferingRepository.findAndCount).toHaveBeenCalledWith({
        where: { welperId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findById', () => {
    it('should return service offering by id', async () => {
      const serviceId = 'service-1';
      const offering = {
        id: serviceId,
        welperId: 'welper-1',
        serviceCategoryId: 'category-1',
        serviceDescription: 'Test service',
        hourlyRate: 30.0,
        experienceYears: 5,
        active: true,
      };

      mockServiceOfferingRepository.findOne.mockResolvedValue(offering);

      const result = await service.findById(serviceId);

      expect(result).toEqual(offering);
      expect(mockServiceOfferingRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
      });
    });

    it('should throw NotFoundException if service offering not found', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        'Service offering not found',
      );
    });
  });

  describe('create', () => {
    it('should create a service offering with all fields', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const createDto = {
        serviceCategoryId: 'category-1',
        serviceDescription: 'Professional service',
        hourlyRate: 30.0,
        experienceYears: 5,
        subcategoryIds: ['subcategory-1'],
        serviceArea: {
          type: 'Point',
          coordinates: [-122.4, 37.8],
        },
        active: true,
      };

      const welperProfile = { id: 'profile-1', welperId };
      const savedService = {
        id: 'service-1',
        welperId,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockServiceOfferingRepository.create.mockReturnValue(savedService);
      mockServiceOfferingRepository.save.mockResolvedValue(savedService);
      mockEventPublisher.publishServiceOfferingAdded.mockResolvedValue(undefined);

      const result = await service.create(welperId, createDto, userId);

      expect(result).toEqual(savedService);
      expect(mockServiceOfferingRepository.create).toHaveBeenCalledWith({
        ...createDto,
        welperId,
        experienceYears: 5,
        active: true,
        serviceArea: createDto.serviceArea,
        subcategoryIds: createDto.subcategoryIds,
      });
      expect(mockServiceOfferingRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishServiceOfferingAdded).toHaveBeenCalledWith({
        serviceOfferingId: savedService.id,
        welperId: savedService.welperId,
        serviceCategoryId: savedService.serviceCategoryId,
        timestamp: expect.any(String),
      });
    });

    it('should create a service offering with default experienceYears (1) when not provided', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const createDto = {
        serviceCategoryId: 'category-1',
        serviceDescription: 'Professional service',
        hourlyRate: 30.0,
        subcategoryIds: ['subcategory-1'],
      };

      const welperProfile = { id: 'profile-1', welperId };
      const savedService = {
        id: 'service-1',
        welperId,
        ...createDto,
        experienceYears: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockServiceOfferingRepository.create.mockReturnValue(savedService);
      mockServiceOfferingRepository.save.mockResolvedValue(savedService);
      mockEventPublisher.publishServiceOfferingAdded.mockResolvedValue(undefined);

      const result = await service.create(welperId, createDto, userId);

      expect(result.experienceYears).toBe(1);
      expect(mockServiceOfferingRepository.create).toHaveBeenCalledWith({
        ...createDto,
        welperId,
        experienceYears: 1,
        active: true,
        serviceArea: undefined,
        subcategoryIds: createDto.subcategoryIds,
      });
    });

    it('should create a service offering with default active (true) when not provided', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const createDto = {
        serviceCategoryId: 'category-1',
        serviceDescription: 'Professional service',
        hourlyRate: 30.0,
        experienceYears: 5,
        subcategoryIds: ['subcategory-1'],
      };

      const welperProfile = { id: 'profile-1', welperId };
      const savedService = {
        id: 'service-1',
        welperId,
        ...createDto,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockServiceOfferingRepository.create.mockReturnValue(savedService);
      mockServiceOfferingRepository.save.mockResolvedValue(savedService);
      mockEventPublisher.publishServiceOfferingAdded.mockResolvedValue(undefined);

      await service.create(welperId, createDto, userId);

      expect(mockServiceOfferingRepository.create).toHaveBeenCalledWith({
        ...createDto,
        welperId,
        experienceYears: 5,
        active: true,
        serviceArea: undefined,
        subcategoryIds: createDto.subcategoryIds,
      });
    });

    it('should create a service offering with active false when explicitly set', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const createDto = {
        serviceCategoryId: 'category-1',
        serviceDescription: 'Professional service',
        hourlyRate: 30.0,
        active: false,
        subcategoryIds: ['subcategory-1'],
      };

      const welperProfile = { id: 'profile-1', welperId };
      const savedService = {
        id: 'service-1',
        welperId,
        ...createDto,
        experienceYears: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(welperProfile);
      mockServiceOfferingRepository.create.mockReturnValue(savedService);
      mockServiceOfferingRepository.save.mockResolvedValue(savedService);
      mockEventPublisher.publishServiceOfferingAdded.mockResolvedValue(undefined);

      await service.create(welperId, createDto, userId);

      expect(mockServiceOfferingRepository.create).toHaveBeenCalledWith({
        ...createDto,
        welperId,
        experienceYears: 1,
        active: false,
        serviceArea: undefined,
        subcategoryIds: createDto.subcategoryIds,
      });
    });

    it('should throw NotFoundException if welper profile not found', async () => {
      mockWelperProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('welper-1', { serviceCategoryId: 'cat-1', serviceDescription: 'Service', hourlyRate: 25.0 }, 'welper-1'),
      ).rejects.toThrow('Welper profile not found');
    });

    it('should throw ForbiddenException if creating for another user', async () => {
      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', welperId: 'welper-1' });

      await expect(
        service.create('welper-1', { serviceCategoryId: 'cat-1', serviceDescription: 'Service', hourlyRate: 25.0 }, 'different-user'),
      ).rejects.toThrow('You can only add services to your own profile');
    });
  });

  describe('update', () => {
    it('should update a service offering with all fields', async () => {
      const welperId = 'welper-1';
      const serviceId = 'service-1';
      const userId = 'welper-1';
      const existingService = {
        id: serviceId,
        welperId,
        serviceCategoryId: 'category-1',
        serviceDescription: 'Old description',
        hourlyRate: 30.0,
        experienceYears: 5,
        serviceArea: null,
        active: true,
      };

      const updateDto = {
        serviceDescription: 'Updated description',
        hourlyRate: 35.0,
        experienceYears: 7,
        serviceArea: {
          type: 'Point',
          coordinates: [-122.4, 37.8],
        },
        active: false,
      };

      const updatedService = { ...existingService, ...updateDto };

      mockServiceOfferingRepository.findOne.mockResolvedValue(existingService);
      mockServiceOfferingRepository.save.mockResolvedValue(updatedService);

      const result = await service.update(welperId, serviceId, updateDto, userId);

      expect(result.serviceDescription).toBe('Updated description');
      expect(result.hourlyRate).toBe(35.0);
      expect(result.experienceYears).toBe(7);
      expect(result.serviceArea).toEqual(updateDto.serviceArea);
      expect(result.active).toBe(false);
      expect(mockServiceOfferingRepository.save).toHaveBeenCalledWith(updatedService);
    });

    it('should update only provided fields (partial update)', async () => {
      const welperId = 'welper-1';
      const serviceId = 'service-1';
      const userId = 'welper-1';
      const existingService = {
        id: serviceId,
        welperId,
        serviceCategoryId: 'category-1',
        serviceDescription: 'Old description',
        hourlyRate: 30.0,
        experienceYears: 5,
        serviceArea: null,
        active: true,
      };

      const updateDto = {
        serviceDescription: 'Updated description',
      };

      const updatedService = { ...existingService, serviceDescription: 'Updated description' };

      mockServiceOfferingRepository.findOne.mockResolvedValue(existingService);
      mockServiceOfferingRepository.save.mockResolvedValue(updatedService);

      const result = await service.update(welperId, serviceId, updateDto, userId);

      expect(result.serviceDescription).toBe('Updated description');
      expect(result.hourlyRate).toBe(30.0); // Unchanged
      expect(result.experienceYears).toBe(5); // Unchanged
      expect(result.active).toBe(true); // Unchanged
    });

    it('should update serviceCategoryId', async () => {
      const welperId = 'welper-1';
      const serviceId = 'service-1';
      const userId = 'welper-1';
      const existingService = {
        id: serviceId,
        welperId,
        serviceCategoryId: 'category-1',
        serviceDescription: 'Service',
        hourlyRate: 30.0,
        experienceYears: 5,
        active: true,
      };

      const updateDto = {
        serviceCategoryId: 'category-2',
      };

      const updatedService = { ...existingService, serviceCategoryId: 'category-2' };

      mockServiceOfferingRepository.findOne.mockResolvedValue(existingService);
      mockServiceOfferingRepository.save.mockResolvedValue(updatedService);

      const result = await service.update(welperId, serviceId, updateDto, userId);

      expect(result.serviceCategoryId).toBe('category-2');
    });

    it('should throw NotFoundException if service offering not found', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('welper-1', 'non-existent', { serviceDescription: 'Updated' }, 'welper-1'),
      ).rejects.toThrow('Service offering not found');
    });

    it('should throw ForbiddenException if updating another user service', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue({
        id: 'service-1',
        welperId: 'welper-1',
      });

      await expect(
        service.update('welper-1', 'service-1', { serviceDescription: 'Updated' }, 'different-user'),
      ).rejects.toThrow('You can only update your own services');
    });

    it('should throw ForbiddenException if service offering belongs to different welper', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue({
        id: 'service-1',
        welperId: 'different-welper',
      });

      await expect(
        service.update('welper-1', 'service-1', { serviceDescription: 'Updated' }, 'welper-1'),
      ).rejects.toThrow('Service offering does not belong to this welper');
    });
  });

  describe('delete', () => {
    it('should delete a service offering', async () => {
      const welperId = 'welper-1';
      const serviceId = 'service-1';
      const userId = 'welper-1';
      const existingService = {
        id: serviceId,
        welperId,
        serviceCategoryId: 'category-1',
        serviceDescription: 'Service',
        hourlyRate: 30.0,
        experienceYears: 5,
        active: true,
      };

      mockServiceOfferingRepository.findOne.mockResolvedValue(existingService);
      mockServiceOfferingRepository.remove.mockResolvedValue(existingService);

      await service.delete(welperId, serviceId, userId);

      expect(mockServiceOfferingRepository.findOne).toHaveBeenCalledWith({
        where: { id: serviceId },
      });
      expect(mockServiceOfferingRepository.remove).toHaveBeenCalledWith(existingService);
    });

    it('should throw NotFoundException if service offering not found', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('welper-1', 'non-existent', 'welper-1')).rejects.toThrow(
        'Service offering not found',
      );
    });

    it('should throw ForbiddenException if deleting another user service', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue({
        id: 'service-1',
        welperId: 'welper-1',
      });

      await expect(service.delete('welper-1', 'service-1', 'different-user')).rejects.toThrow(
        'You can only delete your own services',
      );
    });

    it('should throw ForbiddenException if service offering belongs to different welper', async () => {
      mockServiceOfferingRepository.findOne.mockResolvedValue({
        id: 'service-1',
        welperId: 'different-welper',
      });

      await expect(service.delete('welper-1', 'service-1', 'welper-1')).rejects.toThrow(
        'Service offering does not belong to this welper',
      );
    });
  });
});

