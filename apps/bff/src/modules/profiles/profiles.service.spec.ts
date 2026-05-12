import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CustomerProfileService } from '../../domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../../domains/profile-management/welper-profile/welper-profile.service';
import { ServiceOfferingService } from '../../domains/profile-management/service-offering/service-offering.service';
import { FavoriteService } from '../../domains/profile-management/favorite/favorite.service';
import { AvailabilityService } from '../../domains/profile-management/availability/availability.service';
import { UsersService } from '../../domains/user-management/users/users.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let customerProfileService: jest.Mocked<Pick<CustomerProfileService, 'findByCustomerId' | 'update' | 'markOnboardingComplete'>>;
  let welperProfileService: jest.Mocked<
    Pick<
      WelperProfileService,
      'findByWelperId' | 'findHydratedByWelperId' | 'hydrate' | 'update' | 'markOnboardingComplete'
    >
  >;

  beforeEach(async () => {
    const mockCustomerProfileService = {
      findByCustomerId: jest.fn(),
      update: jest.fn(),
      markOnboardingComplete: jest.fn(),
    };

    const mockWelperProfileService = {
      findByWelperId: jest.fn(),
      findHydratedByWelperId: jest.fn(),
      hydrate: jest.fn(),
      update: jest.fn(),
      markOnboardingComplete: jest.fn(),
    };

    const mockServiceOfferingService = {
      findByWelperId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockFavoriteService = {
      create: jest.fn(),
      remove: jest.fn(),
      findByCustomerId: jest.fn(),
      removeByFavoriteId: jest.fn(),
    };

    const mockAvailabilityService = {
      findByWelperId: jest.fn(),
      update: jest.fn(),
      findExceptionsByWelperId: jest.fn(),
      createException: jest.fn(),
      deleteException: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-1',
        stripeDefaultPaymentMethodId: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: CustomerProfileService, useValue: mockCustomerProfileService },
        { provide: WelperProfileService, useValue: mockWelperProfileService },
        { provide: ServiceOfferingService, useValue: mockServiceOfferingService },
        { provide: FavoriteService, useValue: mockFavoriteService },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    customerProfileService = module.get(CustomerProfileService);
    welperProfileService = module.get(WelperProfileService);
  });

  describe('getMyProfile', () => {
    it('should get customer profile when user is customer', async () => {
      const mockProfile = {
        customerId: 'user-1',
        firstName: 'John',
      };

      customerProfileService.findByCustomerId.mockResolvedValue(mockProfile as any);

      const result = await service.getMyProfile('user-1', 'Customer');

      expect(customerProfileService.findByCustomerId).toHaveBeenCalledWith('user-1');
      expect(welperProfileService.findByWelperId).not.toHaveBeenCalled();
      expect(result).toEqual({ ...mockProfile, hasDefaultPaymentMethod: false });
    });

    it('should get hydrated welper profile (Wave 1 trust signals) when user is welper', async () => {
      const mockHydrated = {
        welperId: 'user-1',
        bio: 'Test bio',
        verified: false,
        averageRating: null,
        reviewCount: 0,
        responseTimeMinutes: null,
        serviceAreaInfo: null,
      };

      welperProfileService.findHydratedByWelperId.mockResolvedValue(mockHydrated as any);

      const result = await service.getMyProfile('user-1', 'Welper');

      expect(welperProfileService.findHydratedByWelperId).toHaveBeenCalledWith('user-1');
      expect(customerProfileService.findByCustomerId).not.toHaveBeenCalled();
      expect(result).toEqual(mockHydrated);
    });

    it('should handle lowercase accountType', async () => {
      welperProfileService.findHydratedByWelperId.mockResolvedValue({} as any);

      await service.getMyProfile('user-1', 'welper');

      expect(welperProfileService.findHydratedByWelperId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('completeOnboarding', () => {
    it('should call profile domain markOnboardingComplete for customer', async () => {
      customerProfileService.markOnboardingComplete.mockResolvedValue({
        onboardingCompleted: true,
      } as any);

      const result = await service.completeOnboarding('user-1', 'Customer');

      expect(customerProfileService.markOnboardingComplete).toHaveBeenCalledWith('user-1', 'user-1');
      expect(welperProfileService.markOnboardingComplete).not.toHaveBeenCalled();
      expect(result.onboardingCompleted).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from profile service', async () => {
      customerProfileService.findByCustomerId.mockRejectedValue(
        new HttpException('Profile not found', 404),
      );

      await expect(service.getMyProfile('user-1', 'Customer')).rejects.toThrow(HttpException);
    });
  });
});
