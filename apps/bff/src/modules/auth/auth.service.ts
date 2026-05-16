import { Injectable, Inject } from '@nestjs/common';
import { platformAccessEnabledForClients } from '../../common/platform-access';
import { CustomerProfileService } from '../../domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../../domains/profile-management/welper-profile/welper-profile.service';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  RequestResetPasswordDto,
  ConfirmResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
  BeginSignupDto,
  SelectRoleStepDto,
  IdentityStepDto,
  WelperBioStepDto,
  WelperServiceAreaStepDto,
  WelperOfferingStepDto,
  WelperAvailabilityStepDto,
  WelperPayoutStepDto,
  NotificationPrefsStepDto,
  OptionalProfileStepDto,
} from './dto';
import {
  SignupOrchestratorService,
  type SignupState,
} from '../../domains/user-management/auth/signup-orchestrator.service';
import { AuthService as DomainAuthService } from '../../domains/user-management/auth/auth.service';
import type { UserAccount } from '../../domains/user-management/entities/user-account.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DomainAuthService')
    private readonly domainAuthService: DomainAuthService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly welperProfileService: WelperProfileService,
    private readonly signupOrchestrator: SignupOrchestratorService,
  ) {}

  async login(loginDto: LoginDto) {
    const loginResponse = await this.domainAuthService.login(loginDto);

    // Ensure onboardingCompleted is always explicitly set from profile (plain object so it serializes)
    let onboardingCompleted = false;
    try {
      const accountType = (loginResponse.user as { accountType?: string })?.accountType?.toLowerCase();
      if (accountType === 'customer' || accountType === 'welper') {
        const profile =
          accountType === 'customer'
            ? await this.customerProfileService.findByCustomerId(loginResponse.user.id)
            : await this.welperProfileService.findByWelperId(loginResponse.user.id);
        onboardingCompleted = profile?.onboardingCompleted ?? false;
      }
    } catch {
      // keep false
    }

    // Profile domain owns onboarding; attach as top-level .profile (user stays account-only)
    const user = loginResponse.user as Record<string, unknown>;
    return {
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      user: {
        id: user?.id,
        email: user?.email,
        accountType: user?.accountType,
        status: user?.status,
        emailVerified: user?.emailVerified,
        signupCompleted: user?.signupCompleted as boolean | undefined,
        platformAccessEnabled: platformAccessEnabledForClients(),
      },
      profile: {
        onboardingCompleted,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    return this.domainAuthService.register({
      email: registerDto.email,
      password: registerDto.password,
      accountType: registerDto.accountType,
      referralCode: registerDto.referralCode,
      preferredLocale: registerDto.preferredLocale,
    } as Parameters<DomainAuthService['register']>[0]);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    return this.domainAuthService.verifyEmail({
      email: verifyEmailDto.email,
      token: verifyEmailDto.token,
    });
  }

  async resendVerificationEmail(userId: string) {
    return this.domainAuthService.resendVerificationEmail(userId);
  }

  async requestResetPassword(requestResetPasswordDto: RequestResetPasswordDto) {
    return this.domainAuthService.requestResetPassword({
      email: requestResetPasswordDto.email,
      preferredLocale: requestResetPasswordDto.preferredLocale,
    });
  }

  async updatePreferredLocale(userId: string, preferredLocale: 'en' | 'fr') {
    return this.domainAuthService.updatePreferredLocale(userId, preferredLocale);
  }

  async confirmResetPassword(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return this.domainAuthService.confirmResetPassword({
      token: confirmResetPasswordDto.token,
      newPassword: confirmResetPasswordDto.newPassword,
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    return this.domainAuthService.changePassword(userId, {
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
    });
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    return this.domainAuthService.refreshToken(refreshTokenDto.refreshToken);
  }

  // ---------------------------------------------------------------------
  // Day 15 — Signup ↔ onboarding merge, Phase 1.
  //
  // Per-step wiring around the SignupOrchestratorService. Tokens are minted
  // by the domain auth service (single source of truth for JWT signing).
  // ---------------------------------------------------------------------

  async beginSignup(dto: BeginSignupDto): Promise<{
    accessToken: string;
    refreshToken: string;
    signupState: SignupState;
  }> {
    const { user, signupState } = await this.signupOrchestrator.beginSignup(dto);
    const tokens = await this.domainAuthService.generateTokensFor(
      user as UserAccount,
    );
    return { ...tokens, signupState };
  }

  getSignupState(userId: string): Promise<SignupState> {
    return this.signupOrchestrator.getState(userId);
  }

  submitSelectRoleStep(userId: string, dto: SelectRoleStepDto) {
    return this.signupOrchestrator.submitSelectRoleStep(userId, dto);
  }
  submitIdentityStep(userId: string, dto: IdentityStepDto) {
    return this.signupOrchestrator.submitIdentityStep(userId, dto);
  }
  submitWelperBioStep(userId: string, dto: WelperBioStepDto) {
    return this.signupOrchestrator.submitWelperBioStep(userId, dto);
  }
  submitWelperServiceAreaStep(userId: string, dto: WelperServiceAreaStepDto) {
    return this.signupOrchestrator.submitWelperServiceAreaStep(userId, dto);
  }
  submitWelperOfferingStep(userId: string, dto: WelperOfferingStepDto) {
    return this.signupOrchestrator.submitWelperOfferingStep(userId, dto);
  }
  submitWelperAvailabilityStep(userId: string, dto: WelperAvailabilityStepDto) {
    return this.signupOrchestrator.submitWelperAvailabilityStep(userId, dto);
  }
  submitWelperBackgroundCheckStep(userId: string) {
    return this.signupOrchestrator.submitWelperBackgroundCheckStep(userId);
  }
  submitWelperPayoutStep(userId: string, dto: WelperPayoutStepDto) {
    return this.signupOrchestrator.submitWelperPayoutStep(userId, dto);
  }
  submitNotificationPrefsStep(userId: string, dto: NotificationPrefsStepDto) {
    return this.signupOrchestrator.submitNotificationPrefsStep(userId, dto);
  }
  submitOptionalProfileStep(userId: string, dto: OptionalProfileStepDto) {
    return this.signupOrchestrator.submitOptionalProfileStep(userId, dto);
  }
  finishSignup(userId: string) {
    return this.signupOrchestrator.finishSignup(userId);
  }
}
