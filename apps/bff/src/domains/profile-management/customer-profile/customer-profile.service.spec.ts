import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { UserAccount } from '../../user-management/entities/user-account.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { ProfileCompletionStatus } from '../entities/profile-completion-status.enum';
import { CustomerProfileAggregatesService } from './customer-profile-aggregates.service';

describe('CustomerProfileService', () => {
  let service: CustomerProfileService;
  let repository: Repository<CustomerProfile>;
  let eventPublisher: EventPublisherService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEventPublisher = {
    publishProfileCreated: jest.fn(),
    publishProfileUpdated: jest.fn(),
  };

  const mockUserAccountRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    mockUserAccountRepository.findOne.mockResolvedValue({
      id: 'customer-1',
      stripeDefaultPaymentMethodId: 'pm_test',
    } as UserAccount);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProfileService,
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserAccountRepository,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
        {
          provide: CustomerProfileAggregatesService,
          useValue: { getAggregates: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CustomerProfileService>(CustomerProfileService);
    repository = module.get<Repository<CustomerProfile>>(
      getRepositoryToken(CustomerProfile),
    );
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /** Shared shape for a profile that satisfies name / phone / address (completion logic only checks presence). */
  const fullProfileFields = {
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: { countryCode: '+1', number: '234567890', formatted: '+1 (234) 567-890' },
    address: {
      streetAddress: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  };

  describe('profile completion and default payment method', () => {
    it('create: Incomplete when required fields are present but user has no default payment method', async () => {
      mockUserAccountRepository.findOne.mockResolvedValue({
        id: 'customer-1',
        stripeDefaultPaymentMethodId: null,
      } as UserAccount);

      const createDto = { customerId: 'customer-1', ...fullProfileFields };
      const createdEntity = {
        id: 'profile-new',
        ...createDto,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdEntity);
      mockRepository.save.mockImplementation(async (p: CustomerProfile) => ({ ...p }));

      const result = await service.create(createDto);

      expect(mockUserAccountRepository.findOne).toHaveBeenCalledWith({ where: { id: 'customer-1' } });
      expect(result.profileCompletionStatus).toBe(ProfileCompletionStatus.INCOMPLETE);
    });

    it('create: Complete when required fields are present and user has default payment method', async () => {
      mockUserAccountRepository.findOne.mockResolvedValue({
        id: 'customer-1',
        stripeDefaultPaymentMethodId: 'pm_abc',
      } as UserAccount);

      const createDto = { customerId: 'customer-1', ...fullProfileFields };
      const createdEntity = {
        id: 'profile-new',
        ...createDto,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdEntity);
      mockRepository.save.mockImplementation(async (p: CustomerProfile) => ({ ...p }));

      const result = await service.create(createDto);

      expect(result.profileCompletionStatus).toBe(ProfileCompletionStatus.COMPLETE);
    });

    it('update: Incomplete when all required profile fields are filled but no default payment method', async () => {
      mockUserAccountRepository.findOne.mockResolvedValue({
        id: 'customer-1',
        stripeDefaultPaymentMethodId: null,
      } as UserAccount);

      const customerId = 'customer-1';
      const existingProfile = {
        id: 'profile-1',
        customerId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        address: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
      };

      const updateDto = {
        firstName: 'Jane',
        phoneNumber: fullProfileFields.phoneNumber,
        address: fullProfileFields.address,
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockRepository.save.mockImplementation(async (p: CustomerProfile) => ({ ...p }));

      const result = await service.update(customerId, updateDto, customerId);

      expect(result.profileCompletionStatus).toBe(ProfileCompletionStatus.INCOMPLETE);
    });

    it('update: Complete when all required fields and default payment method are present', async () => {
      mockUserAccountRepository.findOne.mockResolvedValue({
        id: 'customer-1',
        stripeDefaultPaymentMethodId: 'pm_default',
      } as UserAccount);

      const customerId = 'customer-1';
      const existingProfile = {
        id: 'profile-1',
        customerId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        address: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
      };

      const updateDto = {
        phoneNumber: fullProfileFields.phoneNumber,
        address: fullProfileFields.address,
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockRepository.save.mockImplementation(async (p: CustomerProfile) => ({ ...p }));

      const result = await service.update(customerId, updateDto, customerId);

      expect(result.profileCompletionStatus).toBe(ProfileCompletionStatus.COMPLETE);
    });
  });

  describe('refreshProfileCompletionFromPayment', () => {
    it('should recalculate status and save when profile exists', async () => {
      mockUserAccountRepository.findOne.mockResolvedValue({
        id: 'customer-1',
        stripeDefaultPaymentMethodId: 'pm_saved',
      } as UserAccount);

      const profile = {
        id: 'profile-1',
        customerId: 'customer-1',
        ...fullProfileFields,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: true,
      };

      mockRepository.findOne.mockResolvedValue(profile);
      mockRepository.save.mockResolvedValue({
        ...profile,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      });

      await service.refreshProfileCompletionFromPayment('customer-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { customerId: 'customer-1' } });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        }),
      );
    });

    it('should no-op when no customer profile exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.refreshProfileCompletionFromPayment('unknown-customer');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer profile', async () => {
      const createDto = {
        customerId: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: { countryCode: '+1', number: '234567890', formatted: '+1 (234) 567-890' },
        address: {
          streetAddress: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      };

      const savedProfile = {
        id: 'profile-1',
        ...createDto,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(savedProfile);
      mockRepository.save.mockResolvedValue(savedProfile);
      mockEventPublisher.publishProfileCreated.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toEqual(savedProfile);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishProfileCreated).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if profile already exists', async () => {
      const createDto = {
        customerId: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.findOne.mockResolvedValue({ id: 'existing-profile' });

      await expect(service.create(createDto)).rejects.toThrow('Customer profile already exists');
    });
  });

  describe('findByCustomerId', () => {
    it('should return customer profile', async () => {
      const customerId = 'customer-1';
      const profile = {
        id: 'profile-1',
        customerId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: { countryCode: '+1', number: '234567890' },
        address: {
          streetAddress: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        onboardingCompleted: false,
      };

      mockRepository.findOne.mockResolvedValue(profile);

      const result = await service.findByCustomerId(customerId);

      expect(result).toEqual(profile);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { customerId } });
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCustomerId('non-existent')).rejects.toThrow('Customer profile not found');
    });
  });

  describe('update', () => {
    it('should update customer profile', async () => {
      const customerId = 'customer-1';
      const userId = 'customer-1';
      const existingProfile = {
        id: 'profile-1',
        customerId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        address: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
      };

      const updateDto = {
        firstName: 'Jane',
        phoneNumber: { countryCode: '+1', number: '234567890' },
        address: {
          streetAddress: '456 Oak Ave',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
        },
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
        profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockRepository.save.mockResolvedValue(updatedProfile);
      mockEventPublisher.publishProfileUpdated.mockResolvedValue(undefined);

      const result = await service.update(customerId, updateDto, userId);

      expect(result.firstName).toBe('Jane');
      expect(result.phoneNumber).toEqual(updateDto.phoneNumber);
      expect(result.address).toEqual(updateDto.address);
      expect(result.profileCompletionStatus).toBe(ProfileCompletionStatus.COMPLETE);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishProfileUpdated).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if updating another user profile', async () => {
      const customerId = 'customer-1';
      const userId = 'different-user';

      mockRepository.findOne.mockResolvedValue({ id: 'profile-1', customerId });

      await expect(service.update(customerId, { firstName: 'Jane' }, userId)).rejects.toThrow(
        'You can only update your own profile',
      );
    });
  });

  describe('markOnboardingComplete', () => {
    it('should mark onboarding as complete', async () => {
      const customerId = 'customer-1';
      const userId = 'customer-1';
      const profile = {
        id: 'profile-1',
        customerId,
        firstName: 'John',
        lastName: 'Doe',
        onboardingCompleted: false,
      };

      const updatedProfile = { ...profile, onboardingCompleted: true };

      mockRepository.findOne.mockResolvedValue(profile);
      mockRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.markOnboardingComplete(customerId, userId);

      expect(result.onboardingCompleted).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if marking another user onboarding complete', async () => {
      const customerId = 'customer-1';
      const userId = 'different-user';

      mockRepository.findOne.mockResolvedValue({ id: 'profile-1', customerId });

      await expect(service.markOnboardingComplete(customerId, userId)).rejects.toThrow(
        'You can only mark your own onboarding as complete',
      );
    });
  });
});
