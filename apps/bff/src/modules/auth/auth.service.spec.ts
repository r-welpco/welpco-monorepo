import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { CustomerProfileService } from '../../domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../../domains/profile-management/welper-profile/welper-profile.service';
import { SignupOrchestratorService } from '../../domains/user-management/auth/signup-orchestrator.service';
import { UsersService } from '../../domains/user-management/users/users.service';
import { LoginDto, RegisterDto, VerifyEmailDto, RefreshTokenDto, RequestResetPasswordDto, ConfirmResetPasswordDto, ChangePasswordDto } from './dto';

describe('AuthService', () => {
  let service: AuthService;
  let domainAuthService: {
    login: jest.Mock;
    register: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerificationEmail: jest.Mock;
    requestResetPassword: jest.Mock;
    confirmResetPassword: jest.Mock;
    changePassword: jest.Mock;
    refreshToken: jest.Mock;
  };
  let customerProfileService: jest.Mocked<Pick<CustomerProfileService, 'findByCustomerId'>>;
  let welperProfileService: jest.Mocked<Pick<WelperProfileService, 'findByWelperId'>>;

  beforeEach(async () => {
    const mockDomainAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      requestResetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      generateTokensFor: jest.fn().mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
    };

    const mockCustomerProfileService = {
      findByCustomerId: jest.fn(),
    };

    const mockWelperProfileService = {
      findByWelperId: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'user-1', userId: 'user-1' }),
    };

    const mockUsersService = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const mockSignupOrchestratorService = {
      beginSignup: jest.fn(),
      submitSelectRoleStep: jest.fn(),
      submitIdentityStep: jest.fn(),
      submitWelperBioStep: jest.fn(),
      submitWelperServiceAreaStep: jest.fn(),
      submitWelperOfferingStep: jest.fn(),
      submitWelperAvailabilityStep: jest.fn(),
      submitWelperPayoutStep: jest.fn(),
      submitNotificationPrefsStep: jest.fn(),
      submitOptionalProfileStep: jest.fn(),
      finishSignup: jest.fn(),
      getState: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'DomainAuthService', useValue: mockDomainAuthService },
        { provide: CustomerProfileService, useValue: mockCustomerProfileService },
        { provide: WelperProfileService, useValue: mockWelperProfileService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SignupOrchestratorService, useValue: mockSignupOrchestratorService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    domainAuthService = module.get('DomainAuthService');
    customerProfileService = module.get(CustomerProfileService);
    welperProfileService = module.get(WelperProfileService);
  });

  describe('login', () => {
    it('should call domainAuthService.login and set onboardingCompleted from customer profile', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-1', email: 'test@example.com', accountType: 'Customer', status: 'Active', emailVerified: true },
      };

      domainAuthService.login.mockResolvedValue(mockResponse);
      customerProfileService.findByCustomerId.mockResolvedValue({ onboardingCompleted: true } as any);

      const result = await service.login(loginDto);

      expect(domainAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(customerProfileService.findByCustomerId).toHaveBeenCalledWith('user-1');
      expect(welperProfileService.findByWelperId).not.toHaveBeenCalled();
      expect(result.profile.onboardingCompleted).toBe(true);
      expect(result).toMatchObject({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
        }),
        profile: { onboardingCompleted: true },
      });
    });

    it('should propagate errors from domainAuthService', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong',
      };

      domainAuthService.login.mockRejectedValue(
        new HttpException('Invalid credentials', 401),
      );

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);
    });

    it('should set onboardingCompleted to false if profile fetch fails', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-1', email: 'test@example.com', accountType: 'Customer', status: 'Active', emailVerified: true },
      };

      domainAuthService.login.mockResolvedValue(mockResponse);
      customerProfileService.findByCustomerId.mockRejectedValue(new Error('Profile not found'));

      const result = await service.login(loginDto);

      expect(result.profile.onboardingCompleted).toBe(false);
    });

    it('should set onboardingCompleted to false if accountType is not customer or welper', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-1', email: 'test@example.com', accountType: 'Admin', status: 'Active', emailVerified: true },
      };

      domainAuthService.login.mockResolvedValue(mockResponse);

      const result = await service.login(loginDto);

      expect(result.profile.onboardingCompleted).toBe(false);
      expect(customerProfileService.findByCustomerId).not.toHaveBeenCalled();
      expect(welperProfileService.findByWelperId).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should call domainAuthService.register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        accountType: 'Customer' as any,
      };

      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-1', email: 'newuser@example.com' },
      };

      domainAuthService.register.mockResolvedValue(mockResponse);

      const result = await service.register(registerDto);

      expect(domainAuthService.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        accountType: 'Customer',
        referralCode: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include referralCode when provided', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        accountType: 'Customer' as any,
        referralCode: 'REF123',
      };

      domainAuthService.register.mockResolvedValue({} as any);

      await service.register(registerDto);

      expect(domainAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          referralCode: 'REF123',
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should call domainAuthService.verifyEmail with correct parameters', async () => {
      const verifyDto: VerifyEmailDto = {
        email: 'test@example.com',
        token: 'verification-token',
      };

      domainAuthService.verifyEmail.mockResolvedValue({ success: true } as any);

      await service.verifyEmail(verifyDto);

      expect(domainAuthService.verifyEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: 'verification-token',
      });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call domainAuthService.resendVerificationEmail with userId', async () => {
      domainAuthService.resendVerificationEmail.mockResolvedValue({ success: true } as any);

      await service.resendVerificationEmail('user-1');

      expect(domainAuthService.resendVerificationEmail).toHaveBeenCalledWith('user-1');
    });
  });

  describe('requestResetPassword', () => {
    it('should call domainAuthService.requestResetPassword with email', async () => {
      const requestDto: RequestResetPasswordDto = {
        email: 'test@example.com',
      };

      domainAuthService.requestResetPassword.mockResolvedValue({ success: true } as any);

      await service.requestResetPassword(requestDto);

      expect(domainAuthService.requestResetPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('confirmResetPassword', () => {
    it('should call domainAuthService.confirmResetPassword with correct parameters', async () => {
      const confirmDto: ConfirmResetPasswordDto = {
        email: 'test@example.com',
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      };

      domainAuthService.confirmResetPassword.mockResolvedValue({ success: true } as any);

      await service.confirmResetPassword(confirmDto);

      expect(domainAuthService.confirmResetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      });
    });
  });

  describe('changePassword', () => {
    it('should call domainAuthService.changePassword with userId and dto', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      domainAuthService.changePassword.mockResolvedValue({ success: true } as any);

      await service.changePassword('user-1', changePasswordDto);

      expect(domainAuthService.changePassword).toHaveBeenCalledWith('user-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });
    });
  });

  describe('refreshToken', () => {
    it('should call domainAuthService.refreshToken with refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token-123',
      };

      const mockResponse = {
        accessToken: 'new-access-token',
      };

      domainAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await service.refreshToken(refreshTokenDto);

      expect(domainAuthService.refreshToken).toHaveBeenCalledWith('refresh-token-123');
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from domainAuthService', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      domainAuthService.refreshToken.mockRejectedValue(
        new HttpException('Invalid refresh token', 401),
      );

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(HttpException);
    });
  });
});
