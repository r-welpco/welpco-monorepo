import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { VerificationStatus } from '../entities/verification-status.entity';
import { CustomerProfile } from '../../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../profile-management/entities/welper-profile.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { ProfileCreationService } from '../../profile-management/profile-creation/profile-creation.service';
import { ReferralService } from '../referral/referral.service';
import { RegisterDto, LoginDto, ChangePasswordDto, RequestResetPasswordDto } from './dto';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { AccountLockoutService } from './account-lockout.service';
import { NotificationService } from '../../notification/notification.service';
import { EmailNotificationService } from '../../notification/email-notification.service';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserAccount>;
  let verificationRepository: Repository<VerificationStatus>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let eventPublisher: EventPublisherService;
  let referralService: ReferralService;
  let emailVerificationService: EmailVerificationService;
  let module: TestingModule;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomerProfileRepository = {
    findOne: jest.fn(),
  };

  const mockWelperProfileRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  const mockProfileCreationService = {
    createProfileForUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockEventPublisher = {
    publishUserCreated: jest.fn().mockResolvedValue(undefined),
    publishUserSignedIn: jest.fn().mockResolvedValue(undefined),
  };

  const mockReferralService = {
    generateReferralCode: jest.fn(),
    applyReferralCode: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserAccount),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(VerificationStatus),
          useValue: mockVerificationRepository,
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
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ProfileCreationService,
          useValue: mockProfileCreationService,
        },
        {
          provide: EventPublisherService,
          useValue: mockEventPublisher,
        },
        {
          provide: ReferralService,
          useValue: mockReferralService,
        },
        {
          provide: EmailVerificationService,
          useValue: {
            generateVerificationToken: jest.fn().mockResolvedValue('token'),
            verifyEmail: jest.fn().mockResolvedValue(undefined),
            resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordResetService,
          useValue: {
            requestPasswordReset: jest.fn().mockResolvedValue(undefined),
            confirmPasswordReset: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AccountLockoutService,
          useValue: {
            checkLockout: jest.fn().mockResolvedValue(undefined),
            clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
            recordFailedAttempt: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: { save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'mock-id', ...entity })) },
            }),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            getPreferences: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EmailNotificationService,
          useValue: {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    verificationRepository = module.get<Repository<VerificationStatus>>(getRepositoryToken(VerificationStatus));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    eventPublisher = module.get<EventPublisherService>(EventPublisherService);
    referralService = module.get<ReferralService>(ReferralService);
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.compare as jest.Mock).mockClear();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      accountType: AccountType.CUSTOMER,
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        passwordHash: 'hashed-password',
        status: AccountStatus.PENDING,
        emailVerified: false,
      });
      mockVerificationRepository.create.mockReturnValue({ userId: 'mock-id' });
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockReferralService.generateReferralCode.mockResolvedValue({});
      mockEventPublisher.publishUserCreated.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalled();
      // Registration now uses queryRunner.manager.save (transaction)
      expect(mockReferralService.generateReferralCode).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
      );
      expect(mockProfileCreationService.createProfileForUser).toHaveBeenCalledWith(
        expect.any(String),
        registerDto.email,
        registerDto.accountType,
        expect.anything(),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should apply referral code if provided', async () => {
      const registerDtoWithReferral = { ...registerDto, referralCode: 'REF123' };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...registerDtoWithReferral });
      mockVerificationRepository.create.mockReturnValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockReferralService.generateReferralCode.mockResolvedValue({});
      mockReferralService.applyReferralCode.mockResolvedValue({});
      mockEventPublisher.publishUserCreated.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.register(registerDtoWithReferral);

      // Registration uses queryRunner.manager.save (transaction), so user ID comes from mock manager
      expect(mockReferralService.applyReferralCode).toHaveBeenCalledWith(
        'REF123',
        expect.any(String),
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
        lastLoginAt: null,
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, lastLoginAt: new Date() });
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockEventPublisher.publishUserSignedIn.mockResolvedValue(undefined);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.passwordHash);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishUserSignedIn).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
      // Note: onboardingCompleted is now in Profile Management domain
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.SUSPENDED,
        emailVerified: true,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed-password',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.DEACTIVATED,
        emailVerified: true,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const userId = 'user-id';
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should successfully change password', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        passwordHash: 'old-hashed-password',
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, passwordHash: 'new-hashed-password' });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.changePassword(userId, changePasswordDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(bcrypt.compare).toHaveBeenCalledWith(changePasswordDto.currentPassword, 'old-hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 12);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        passwordHash: 'old-hashed-password',
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const userId = 'user-id';

    it('should successfully refresh access token', async () => {
      const payload = { sub: userId, email: 'user@example.com', accountType: AccountType.CUSTOMER };
      const user = {
        id: userId,
        email: 'user@example.com',
        accountType: AccountType.CUSTOMER,
        status: AccountStatus.ACTIVE,
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValueOnce('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          accountType: user.accountType,
        },
        {
          secret: 'test-secret',
          expiresIn: '15m',
        },
      );
      expect(result).toHaveProperty('accessToken', 'new-access-token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: userId };
      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is not active', async () => {
      const payload = { sub: userId };
      const user = {
        id: userId,
        status: AccountStatus.SUSPENDED,
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    const userId = 'user-id';

    it('should return user if active', async () => {
      const user = {
        id: userId,
        email: 'user@example.com',
        status: AccountStatus.ACTIVE,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

    it('should return null if account is not active', async () => {
      const user = {
        id: userId,
        status: AccountStatus.SUSPENDED,
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('requestResetPassword', () => {
    it('should delegate to PasswordResetService', async () => {
      const passwordResetService = service['passwordResetService'] as jest.Mocked<PasswordResetService>;
      (passwordResetService.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);

      await service.requestResetPassword({ email: 'user@example.com' } as RequestResetPasswordDto);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
        { preferredLocale: undefined },
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      await service.verifyEmail({ token: 'test-token' });

      // Email verification is delegated to EmailVerificationService
      // The actual implementation is tested in email-verification.service.spec.ts
    });
  });

  describe('confirmResetPassword', () => {
    it('should confirm password reset successfully', async () => {
      await service.confirmResetPassword({ token: 'test-token', newPassword: 'NewPass123!' });

      // Password reset is delegated to PasswordResetService
      // The actual implementation is tested in password-reset.service.spec.ts
    });
  });
});

