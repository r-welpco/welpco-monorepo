import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import {
  SignupOrchestratorService,
  type SignupStepName,
} from './signup-orchestrator.service';
import {
  UserAccount,
  AccountStatus,
  AccountType,
  SelectedRole,
} from '../entities/user-account.entity';
import { VerificationStatus } from '../entities/verification-status.entity';
import {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  ProfileCompletionStatus,
  ProfileVisibility,
  DayOfWeek,
} from '../../profile-management/entities';
import { NotificationPreference } from '../../notification/entities/notification-preference.entity';
import { ProfileCreationService } from '../../profile-management/profile-creation/profile-creation.service';
import { EmailVerificationService } from './email-verification.service';
import { ReferralService } from '../referral/referral.service';
import { BackgroundCheckService } from '../../safety-verification/background-check.service';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Unit specs for `SignupOrchestratorService`. Focus areas (per
 * `SIGNUP_MERGE_PLAN.md` Phase 1 acceptance):
 *   - Role-required step contracts (customer vs welper).
 *   - Idempotent begin (re-submit returns existing state, not a new account).
 *   - Finish-too-early returns 422 with the correct missing-step list.
 *   - nextStep computation walks the required-step list in order.
 *
 * Repositories are fully mocked — the orchestrator's transaction usage is
 * exercised by an inline DataSource mock that just runs the callback against
 * the same repos.
 */
describe('SignupOrchestratorService', () => {
  let service: SignupOrchestratorService;
  let userRepo: jest.Mocked<Repository<UserAccount>>;
  let verificationRepo: jest.Mocked<Repository<VerificationStatus>>;
  let customerRepo: jest.Mocked<Repository<CustomerProfile>>;
  let welperRepo: jest.Mocked<Repository<WelperProfile>>;
  let offeringRepo: jest.Mocked<Repository<ServiceOffering>>;
  let availabilityRepo: jest.Mocked<Repository<AvailabilityCalendar>>;
  let prefRepo: jest.Mocked<Repository<NotificationPreference>>;
  let profileCreationService: jest.Mocked<ProfileCreationService>;

  const mockUser = (overrides: Partial<UserAccount> = {}): UserAccount =>
    ({
      id: 'user-1',
      email: 'jordan@example.com',
      passwordHash: 'hashed',
      accountType: AccountType.CUSTOMER,
      status: AccountStatus.PENDING,
      emailVerified: false,
      signupCompleted: false,
      selectedRole: null,
      ...overrides,
    }) as UserAccount;

  const mockCustomer = (
    overrides: Partial<CustomerProfile> = {},
  ): CustomerProfile =>
    ({
      id: 'cp-1',
      customerId: 'user-1',
      firstName: '',
      lastName: '',
      profilePhotoUrl: null,
      phoneNumber: null,
      dateOfBirth: null,
      tosAcceptedAt: null,
      privacyAcceptedAt: null,
      optionalProfileStepCompletedAt: null,
      address: null,
      profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
      onboardingCompleted: false,
      servicePreferences: null,
      ...overrides,
    }) as CustomerProfile;

  const mockWelper = (overrides: Partial<WelperProfile> = {}): WelperProfile =>
    ({
      id: 'wp-1',
      welperId: 'user-1',
      firstName: null,
      lastName: null,
      phoneNumber: null,
      bio: null,
      profilePhotoUrl: null,
      serviceArea: null,
      latitude: null,
      longitude: null,
      countryCode: null,
      provinceCode: null,
      rating: null,
      reviewCount: 0,
      verified: false,
      serviceAreaCity: null,
      serviceAreaPostalCodes: null,
      dateOfBirth: null,
      tosAcceptedAt: null,
      privacyAcceptedAt: null,
      optionalProfileStepCompletedAt: null,
      availabilityAdHocOnly: false,
      profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
      profileVisibility: ProfileVisibility.PUBLIC,
      onboardingCompleted: false,
      payoutMethodChoice: null,
      ...overrides,
    }) as WelperProfile;

  beforeEach(async () => {
    const repoMock = () => ({
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
      delete: jest.fn().mockResolvedValue({}),
    });

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
          getRepository: jest.fn().mockImplementation(() => ({
            findOne: jest.fn(),
            save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
            create: jest.fn().mockImplementation((v) => v),
            delete: jest.fn().mockResolvedValue({}),
          })),
        },
      }),
      transaction: jest
        .fn()
        .mockImplementation(async (fn) =>
          fn({
            getRepository: jest.fn().mockImplementation(() => ({
              findOne: jest.fn(),
              save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
              create: jest.fn().mockImplementation((v) => v),
              delete: jest.fn().mockResolvedValue({}),
            })),
          }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupOrchestratorService,
        { provide: getRepositoryToken(UserAccount), useValue: repoMock() },
        {
          provide: getRepositoryToken(VerificationStatus),
          useValue: repoMock(),
        },
        {
          provide: getRepositoryToken(CustomerProfile),
          useValue: repoMock(),
        },
        { provide: getRepositoryToken(WelperProfile), useValue: repoMock() },
        {
          provide: getRepositoryToken(ServiceOffering),
          useValue: repoMock(),
        },
        {
          provide: getRepositoryToken(AvailabilityCalendar),
          useValue: repoMock(),
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: repoMock(),
        },
        {
          provide: ProfileCreationService,
          useValue: { createProfileForUser: jest.fn() },
        },
        {
          provide: EmailVerificationService,
          useValue: { generateVerificationToken: jest.fn() },
        },
        {
          provide: ReferralService,
          useValue: { generateReferralCode: jest.fn() },
        },
        { provide: DataSource, useValue: dataSourceMock },
        {
          provide: BackgroundCheckService,
          useValue: {
            skipForMinor: jest.fn().mockResolvedValue(undefined),
            isSignupStepComplete: jest.fn().mockResolvedValue(false),
            getFilledData: jest.fn().mockResolvedValue({
              paid: false,
              certnStatus: 'not_started',
              listPriceCents: 2599,
              promoPriceCents: 1599,
              promoEnabled: true,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(SignupOrchestratorService);
    userRepo = module.get(getRepositoryToken(UserAccount));
    verificationRepo = module.get(getRepositoryToken(VerificationStatus));
    customerRepo = module.get(getRepositoryToken(CustomerProfile));
    welperRepo = module.get(getRepositoryToken(WelperProfile));
    offeringRepo = module.get(getRepositoryToken(ServiceOffering));
    availabilityRepo = module.get(getRepositoryToken(AvailabilityCalendar));
    prefRepo = module.get(getRepositoryToken(NotificationPreference));
    profileCreationService = module.get(ProfileCreationService);
  });

  // -----------------------------------------------------------------
  // Required-fields contract per role
  // -----------------------------------------------------------------

  describe('getRequiredStepsForRole', () => {
    it('returns the customer step list when role is CUSTOMER', () => {
      const steps = service.getRequiredStepsForRole(SelectedRole.CUSTOMER);
      expect(steps).toEqual<SignupStepName[]>([
        'selectRole',
        'identity',
        'optionalProfile',
      ]);
    });

    it('returns the welper step list when role is WELPER (full wizard contract)', () => {
      const steps = service.getRequiredStepsForRole(SelectedRole.WELPER);
      expect(steps).toEqual<SignupStepName[]>([
        'selectRole',
        'identity',
        'welperBio',
        'welperServiceArea',
        'welperOffering',
        'welperAvailability',
        'welperBackgroundCheck',
        'optionalProfile',
      ]);
    });

    it('returns just selectRole when role is unset', () => {
      const steps = service.getRequiredStepsForRole(null);
      expect(steps).toEqual<SignupStepName[]>(['selectRole']);
    });
  });

  // -----------------------------------------------------------------
  // beginSignup idempotency
  // -----------------------------------------------------------------

  describe('beginSignup', () => {
    it('returns the existing account state when an in-progress signup exists for the email', async () => {
      const existing = mockUser({
        id: 'user-existing',
        email: 'jordan@example.com',
        signupCompleted: false,
      });
      userRepo.findOne.mockResolvedValueOnce(existing); // email lookup
      // getState() refetches — return the same user.
      userRepo.findOne.mockResolvedValue(existing);

      const result = await service.beginSignup({
        email: 'jordan@example.com',
        password: 'irrelevant-here-1!',
      });

      expect(result.isNew).toBe(false);
      expect(result.user.id).toBe('user-existing');
      expect(result.signupState.userId).toBe('user-existing');
    });

    it('throws ACCOUNT_EXISTS when email maps to a completed signup', async () => {
      userRepo.findOne.mockResolvedValueOnce(
        mockUser({
          email: 'jordan@example.com',
          signupCompleted: true,
        }),
      );
      await expect(
        service.beginSignup({
          email: 'jordan@example.com',
          password: 'PasswordOk1!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // -----------------------------------------------------------------
  // finishSignup gating
  // -----------------------------------------------------------------

  describe('finishSignup', () => {
    it('returns 422 with the correct missingFields list when steps remain', async () => {
      const u = mockUser({ selectedRole: SelectedRole.CUSTOMER });
      userRepo.findOne.mockResolvedValue(u);
      // No customer profile fields filled => identity is missing too.
      customerRepo.findOne.mockResolvedValue(mockCustomer());
      prefRepo.find.mockResolvedValue([] as never);

      let caught: any;
      try {
        await service.finishSignup('user-1');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(UnprocessableEntityException);
      const body = caught.getResponse() as any;
      expect(body.code).toBe('INCOMPLETE_SIGNUP');
      expect(body.missingFields).toEqual<SignupStepName[]>([
        'identity',
        'optionalProfile',
      ]);
      expect(body.nextStep).toBe('identity');
    });

    it('lists welper-specific missing steps when role is WELPER and many steps unfilled', async () => {
      const u = mockUser({ selectedRole: SelectedRole.WELPER });
      userRepo.findOne.mockResolvedValue(u);
      welperRepo.findOne.mockResolvedValue(
        mockWelper({
          firstName: 'A',
          lastName: 'B',
          phoneNumber: {
            countryCode: '+1',
            number: '4165551234',
            formatted: '+1 416-555-1234',
          },
        }),
      );
      offeringRepo.findOne.mockResolvedValue(null);
      availabilityRepo.find.mockResolvedValue([] as never);
      prefRepo.find.mockResolvedValue([] as never);

      let caught: any;
      try {
        await service.finishSignup('user-1');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(UnprocessableEntityException);
      const body = caught.getResponse() as any;
      expect(body.missingFields).toContain('welperBio');
      expect(body.missingFields).toContain('welperServiceArea');
      expect(body.missingFields).toContain('welperOffering');
      expect(body.missingFields).toContain('welperAvailability');
      // The first unfilled welper step after identity is `welperBio`.
      expect(body.nextStep).toBe('welperBio');
    });
  });

  // -----------------------------------------------------------------
  // nextStep walk
  // -----------------------------------------------------------------

  describe('getState — nextStep walk', () => {
    it('reports nextStep="selectRole" for a brand-new account', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      prefRepo.find.mockResolvedValue([] as never);
      const state = await service.getState('user-1');
      expect(state.selectedRole).toBeNull();
      expect(state.nextStep).toBe('selectRole');
      expect(state.completedSteps).toEqual([]);
    });

    it('reports nextStep="identity" once role is locked but identity unfilled (customer)', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ selectedRole: SelectedRole.CUSTOMER }),
      );
      customerRepo.findOne.mockResolvedValue(mockCustomer());
      prefRepo.find.mockResolvedValue([] as never);
      const state = await service.getState('user-1');
      expect(state.selectedRole).toBe(SelectedRole.CUSTOMER);
      expect(state.completedSteps).toEqual<SignupStepName[]>(['selectRole']);
      expect(state.nextStep).toBe('identity');
    });

    it('reports nextStep=null when every customer-required step is filled (ready for /finish)', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ selectedRole: SelectedRole.CUSTOMER }),
      );
      customerRepo.findOne.mockResolvedValue(
        mockCustomer({
          firstName: 'Jordan',
          lastName: 'Lee',
          phoneNumber: {
            countryCode: '+1',
            number: '4165551234',
            formatted: '+1 416-555-1234',
          },
          address: {
            streetAddress: '1 Yonge',
            city: 'Toronto',
            state: 'ON',
            zipCode: 'M5V',
          },
        }),
      );
      prefRepo.find.mockResolvedValue([] as never);
      const state = await service.getState('user-1');
      expect(state.completedSteps).toContain('identity');
      expect(state.completedSteps).toContain('optionalProfile');
      expect(state.nextStep).toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // Step-write basics
  // -----------------------------------------------------------------

  describe('submitSelectRoleStep', () => {
    it('locks the role on first write and creates the matching profile', async () => {
      const u = mockUser();
      userRepo.findOne.mockResolvedValue(u);
      profileCreationService.createProfileForUser.mockResolvedValue(
        mockCustomer() as never,
      );
      prefRepo.find.mockResolvedValue([] as never);
      customerRepo.findOne.mockResolvedValue(mockCustomer());

      await service.submitSelectRoleStep('user-1', {
        role: SelectedRole.CUSTOMER,
      });

      // Role mirrored into the legacy accountType.
      expect(u.selectedRole).toBe(SelectedRole.CUSTOMER);
      expect(u.accountType).toBe(AccountType.CUSTOMER);
    });

    it('throws ROLE_LOCKED when re-submitting with a different role', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ selectedRole: SelectedRole.CUSTOMER }),
      );
      await expect(
        service.submitSelectRoleStep('user-1', {
          role: SelectedRole.WELPER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitIdentityStep', () => {
    it('rejects when role is unset', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      await expect(
        service.submitIdentityStep('user-1', {
          firstName: 'J',
          lastName: 'L',
          phone: '+14165551234',
          dateOfBirth: '1995-06-12',
          tosAcceptedAt: new Date().toISOString(),
          privacyAcceptedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitWelperBioStep', () => {
    it('rejects when role is not WELPER (customer trying welper-only step)', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ selectedRole: SelectedRole.CUSTOMER }),
      );
      await expect(
        service.submitWelperBioStep('user-1', {
          bio: 'a'.repeat(125),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
