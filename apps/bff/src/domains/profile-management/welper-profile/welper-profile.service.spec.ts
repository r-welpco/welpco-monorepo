import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfileService, buildServiceAreaInfo } from './welper-profile.service';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ServiceOffering } from '../entities/service-offering.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { ProfileCompletionStatus } from '../entities/profile-completion-status.enum';
import { ProfileVisibility } from '../entities/profile-visibility.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GEOCODE_SERVICE } from '../../geocode/geocode.interface';
import { WelperProfileAggregatesService } from './welper-profile-aggregates.service';

describe('WelperProfileService', () => {
  let service: WelperProfileService;
  let welperProfileRepository: Repository<WelperProfile>;
  let serviceOfferingRepository: Repository<ServiceOffering>;
  let eventPublisher: EventPublisherService;

  const mockWelperProfileRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockServiceOfferingRepository = {
    find: jest.fn(),
  };

  const mockEventPublisher = {
    publishProfileCreated: jest.fn(),
    publishProfileUpdated: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WelperProfileService,
        {
          provide: getRepositoryToken(WelperProfile),
          useValue: mockWelperProfileRepository,
        },
        {
          provide: getRepositoryToken(ServiceOffering),
          useValue: mockServiceOfferingRepository,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
        { provide: GEOCODE_SERVICE, useValue: mockGeocodeService },
        { provide: WelperProfileAggregatesService, useValue: mockAggregatesService },
      ],
    }).compile();

    service = module.get<WelperProfileService>(WelperProfileService);
    welperProfileRepository = module.get<Repository<WelperProfile>>(
      getRepositoryToken(WelperProfile),
    );
    serviceOfferingRepository = module.get<Repository<ServiceOffering>>(
      getRepositoryToken(ServiceOffering),
    );
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a welper profile', async () => {
      const createDto = {
        welperId: 'welper-1',
        bio: 'Experienced service provider',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        serviceArea: {
          type: 'Polygon',
          coordinates: [[[-122.4, 37.8], [-122.3, 37.8], [-122.3, 37.9], [-122.4, 37.9], [-122.4, 37.8]]],
        },
        profileVisibility: ProfileVisibility.PUBLIC,
      };

      const savedProfile = {
        id: 'profile-1',
        ...createDto,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(null);
      mockWelperProfileRepository.create.mockReturnValue(savedProfile);
      mockWelperProfileRepository.save.mockResolvedValue(savedProfile);
      mockEventPublisher.publishProfileCreated.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toEqual(savedProfile);
      expect(mockWelperProfileRepository.create).toHaveBeenCalled();
      expect(mockWelperProfileRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishProfileCreated).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if profile already exists', async () => {
      const createDto = {
        welperId: 'welper-1',
        bio: 'Test bio',
      };

      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'existing-profile' });

      await expect(service.create(createDto)).rejects.toThrow('Welper profile already exists');
    });
  });

  describe('findByWelperId', () => {
    it('should return welper profile with service offerings', async () => {
      const welperId = 'welper-1';
      const profile = {
        id: 'profile-1',
        welperId,
        bio: 'Experienced service provider',
        serviceArea: {
          type: 'Point',
          coordinates: [-122.4, 37.8],
        },
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        onboardingCompleted: false,
      };

      mockWelperProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.findByWelperId(welperId);

      expect(result).toEqual(profile);
      expect(mockWelperProfileRepository.findOne).toHaveBeenCalledWith({
        where: { welperId },
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockWelperProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.findByWelperId('non-existent')).rejects.toThrow('Welper profile not found');
    });
  });

  describe('update', () => {
    it('should update welper profile', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const existingProfile = {
        id: 'profile-1',
        welperId,
        bio: 'Old bio',
        profilePhotoUrl: null,
        serviceArea: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
      };

      const updateDto = {
        bio: 'Updated bio',
        serviceArea: {
          type: 'Point',
          coordinates: [-122.4, 37.8],
        },
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
      };

      mockWelperProfileRepository.findOne
        .mockResolvedValueOnce(existingProfile) // First call for findByWelperId
        .mockResolvedValueOnce(existingProfile); // Second call for calculateCompletionStatus
      mockServiceOfferingRepository.find.mockResolvedValue([]); // Query for service offerings
      mockWelperProfileRepository.save.mockResolvedValue(updatedProfile);
      mockEventPublisher.publishProfileUpdated.mockResolvedValue(undefined);

      const result = await service.update(welperId, updateDto, userId);

      expect(result.bio).toBe('Updated bio');
      expect(mockWelperProfileRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishProfileUpdated).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if updating another user profile', async () => {
      const welperId = 'welper-1';
      const userId = 'different-user';

      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', welperId });

      await expect(service.update(welperId, { bio: 'Updated' }, userId)).rejects.toThrow(
        'You can only update your own profile',
      );
    });
  });

  describe('hydrate', () => {
    it('merges trust aggregates and serviceAreaInfo onto the profile', async () => {
      const profile = {
        id: 'p1',
        welperId: 'w1',
        serviceAreaCity: 'Toronto',
        provinceCode: 'ON',
        countryCode: 'CA',
        serviceAreaPostalCodes: ['M5V', 'M5W'],
        verified: false,
      } as any;
      mockAggregatesService.getAggregates.mockResolvedValueOnce({
        averageRating: 4.92,
        reviewCount: 12,
        responseTimeMinutes: 23,
      });

      const hydrated = await service.hydrate(profile);

      expect(hydrated.averageRating).toBe(4.92);
      expect(hydrated.reviewCount).toBe(12);
      expect(hydrated.responseTimeMinutes).toBe(23);
      expect(hydrated.serviceAreaInfo).toEqual({
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        postalCodes: ['M5V', 'M5W'],
      });
    });
  });

  describe('markOnboardingComplete', () => {
    it('should mark onboarding as complete', async () => {
      const welperId = 'welper-1';
      const userId = 'welper-1';
      const profile = {
        id: 'profile-1',
        welperId,
        bio: 'Experienced service provider',
        onboardingCompleted: false,
      };

      const updatedProfile = { ...profile, onboardingCompleted: true };

      mockWelperProfileRepository.findOne.mockResolvedValue(profile);
      mockWelperProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.markOnboardingComplete(welperId, userId);

      expect(result.onboardingCompleted).toBe(true);
      expect(mockWelperProfileRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if marking another user onboarding complete', async () => {
      const welperId = 'welper-1';
      const userId = 'different-user';

      mockWelperProfileRepository.findOne.mockResolvedValue({ id: 'profile-1', welperId });

      await expect(service.markOnboardingComplete(welperId, userId)).rejects.toThrow(
        'You can only mark your own onboarding as complete',
      );
    });
  });
});

describe('buildServiceAreaInfo', () => {
  it('returns null when no country code is set (bible §22.6: no fabricated location)', () => {
    expect(
      buildServiceAreaInfo({
        serviceAreaCity: 'Toronto',
        serviceAreaPostalCodes: ['M5V'],
        countryCode: null,
        provinceCode: 'ON',
      }),
    ).toBeNull();
  });

  it('returns the structured shape when country is present', () => {
    expect(
      buildServiceAreaInfo({
        serviceAreaCity: 'Toronto',
        serviceAreaPostalCodes: ['M5V', 'M5W'],
        countryCode: 'CA',
        provinceCode: 'ON',
      }),
    ).toEqual({
      city: 'Toronto',
      province: 'ON',
      country: 'CA',
      postalCodes: ['M5V', 'M5W'],
    });
  });

  it('treats empty postal codes / city as empty string array', () => {
    expect(
      buildServiceAreaInfo({
        serviceAreaCity: null,
        serviceAreaPostalCodes: null,
        countryCode: 'CA',
        provinceCode: 'ON',
      }),
    ).toEqual({ city: '', province: 'ON', country: 'CA', postalCodes: [] });
  });

  it('filters out non-string entries from postalCodes defensively', () => {
    expect(
      buildServiceAreaInfo({
        serviceAreaCity: 'Toronto',
        // Defensive: real DB rows should never contain non-strings, but guard anyway.
        serviceAreaPostalCodes: ['M5V', '', null as unknown as string, 'M6G'],
        countryCode: 'CA',
        provinceCode: 'ON',
      }),
    ).toEqual({
      city: 'Toronto',
      province: 'ON',
      country: 'CA',
      postalCodes: ['M5V', 'M6G'],
    });
  });
});

