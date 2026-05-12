/**
 * E2E domain mocks: provide in-process domain service mocks so auth/profile/users
 * routes don't hit the database or external HTTP. Use with Test.createTestingModule
 * .overrideProvider(...).useValue(mock).
 */
import { CustomerProfileService } from '../../src/domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../../src/domains/profile-management/welper-profile/welper-profile.service';
import { AvailabilityService } from '../../src/domains/profile-management/availability/availability.service';
import { UsersService as DomainUsersService } from '../../src/domains/user-management/users/users.service';

export interface DomainAuthServiceMock {
  login: jest.Mock;
  register: jest.Mock;
  verifyEmail: jest.Mock;
  resendVerificationEmail: jest.Mock;
  requestResetPassword: jest.Mock;
  confirmResetPassword: jest.Mock;
  changePassword: jest.Mock;
  refreshToken: jest.Mock;
}

export interface E2EDomainMocks {
  domainAuthService: DomainAuthServiceMock;
  customerProfileService: {
    findByCustomerId: jest.Mock;
    update: jest.Mock;
    markOnboardingComplete: jest.Mock;
    getServicePreferencesForCustomer: jest.Mock;
    updateServicePreferences: jest.Mock;
  };
  welperProfileService: {
    findByWelperId: jest.Mock;
    findHydratedByWelperId: jest.Mock;
    hydrate: jest.Mock;
    update: jest.Mock;
    markOnboardingComplete: jest.Mock;
  };
  availabilityService: {
    findByWelperId: jest.Mock;
    update: jest.Mock;
    findExceptionsByWelperId: jest.Mock;
    createException: jest.Mock;
    deleteException: jest.Mock;
  };
  domainUsersService: { findById: jest.Mock };
}

export function createE2EDomainMocks(): E2EDomainMocks {
  return {
    domainAuthService: {
      login: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      requestResetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
    },
    customerProfileService: {
      findByCustomerId: jest.fn(),
      update: jest.fn(),
      markOnboardingComplete: jest.fn(),
      getServicePreferencesForCustomer: jest.fn(),
      updateServicePreferences: jest.fn(),
    },
    welperProfileService: {
      findByWelperId: jest.fn(),
      // Wave 1: getMyProfile/updateMyProfile route through these for welpers
      // so the response carries verified/averageRating/reviewCount/responseTimeMinutes/serviceAreaInfo.
      findHydratedByWelperId: jest.fn(),
      hydrate: jest.fn(),
      update: jest.fn(),
      markOnboardingComplete: jest.fn(),
    },
    availabilityService: {
      findByWelperId: jest.fn(),
      update: jest.fn(),
      findExceptionsByWelperId: jest.fn(),
      createException: jest.fn(),
      deleteException: jest.fn(),
    },
    domainUsersService: {
      findById: jest.fn(),
    },
  };
}
