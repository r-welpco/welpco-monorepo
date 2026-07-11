import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
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
  UpdatePreferredLocaleDto,
  HumanVerificationDto,
} from './dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { RateLimitGuard } from '../../domains/user-management/auth/guards/rate-limit.guard';
import { RateLimit } from '../../domains/user-management/auth/decorators/rate-limit.decorator';
import { HumanVerificationService } from '../../common/human-verification/human-verification.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly humanVerification: HumanVerificationService,
  ) {}

  @Post('login')
  @UseGuards(RateLimitGuard)
  // Defense in depth alongside AccountLockoutService (5 failed attempts / 15min
  // per account): cap total requests at 10 / 15min per email (falling back to
  // IP when no email is supplied). The cap is deliberately wider than the
  // lockout so legitimate users hit the friendlier lockout message first;
  // the request cap catches credential-stuffing sweeps and bcrypt-exhaustion
  // traffic that lockout (failed-attempts-only) never sees. Signup's single
  // post-signup POST /login per email stays far under this limit, and the
  // guard is bypassed under NODE_ENV=test / DISABLE_RATE_LIMIT=true.
  @RateLimit({ ttl: 900, limit: 10, keyGenerator: (req) => `login:${(req.body?.email || '').toLowerCase().trim() || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 3600, limit: 5, keyGenerator: (req) => `register:${req.ip}` })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto) {
    await this.humanVerification.assertVerified({
      token: registerDto.turnstileToken,
      honeypot: registerDto.website,
      action: 'register',
    });
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @UseGuards(RateLimitGuard)
  // Rate-limit by email (the bucket the user is trying to verify) AND by IP, so
  // an attacker can't bypass the cap by rotating their guess on `token` —
  // which was the previous behaviour: keying on `req.body?.token` meant every
  // 6-digit guess went to a fresh bucket, effectively no rate limit at all.
  // 5 attempts / 15min / email keeps the 6-digit OTP namespace (~900K) out of
  // brute-force reach within the 24h token TTL.
  @RateLimit({ ttl: 900, limit: 5, keyGenerator: (req) => `verify-email:${(req.body?.email || '').toLowerCase().trim() || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-email')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({
    ttl: 900,
    limit: 3,
    keyGenerator: (req) => `resend-verification:${req.user?.userId || req.ip}`,
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerificationEmail(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: HumanVerificationDto = {},
  ) {
    await this.humanVerification.assertVerified({
      token: dto.turnstileToken,
      honeypot: dto.website,
      action: 'resend_verification',
    });
    return this.authService.resendVerificationEmail(user.userId);
  }

  @Patch('preferred-locale')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update preferred email/UI language' })
  @ApiBody({ type: UpdatePreferredLocaleDto })
  @ApiResponse({ status: 200, description: 'Locale updated' })
  async updatePreferredLocale(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdatePreferredLocaleDto,
  ) {
    await this.authService.updatePreferredLocale(user.userId, dto.preferredLocale);
    return { ok: true, preferredLocale: dto.preferredLocale };
  }

  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    ttl: 3600,
    limit: 5,
    keyGenerator: (req) =>
      `password-reset:${(req.body?.email || '').toLowerCase().trim() || req.ip}`,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: RequestResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'No account found for this email address' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestResetPassword(@Body() requestResetPasswordDto: RequestResetPasswordDto) {
    await this.humanVerification.assertVerified({
      token: requestResetPasswordDto.turnstileToken,
      honeypot: requestResetPasswordDto.website,
      action: 'password_reset',
    });
    return this.authService.requestResetPassword(requestResetPasswordDto);
  }

  @Post('reset-password/confirm')
  @UseGuards(RateLimitGuard)
  // Even though reset tokens are 36-char UUIDv4 (high entropy), an unrate-limited
  // confirm endpoint lets an attacker probe a stolen-but-not-yet-used token, or
  // brute-force the token namespace given enough time. Cap at 10 attempts / hour
  // per token (lookup key) AND per IP to keep the endpoint quiet while still
  // letting a real user retry typos in their new password.
  @RateLimit({ ttl: 3600, limit: 10, keyGenerator: (req) => `reset-password-confirm:${req.body?.token || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiBody({ type: ConfirmResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async confirmResetPassword(@Body() confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return this.authService.confirmResetPassword(confirmResetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request - refresh token is required' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    // Additional validation (ValidationPipe should catch this, but adding explicit check for clarity)
    if (!refreshTokenDto?.refreshToken || typeof refreshTokenDto.refreshToken !== 'string' || refreshTokenDto.refreshToken.trim().length === 0) {
      throw new HttpException(
        { message: 'Refresh token is required and must be a non-empty string', statusCode: 400 },
        400,
      );
    }
    return this.authService.refreshToken(refreshTokenDto);
  }

  // ---------------------------------------------------------------------
  // Day 15 — Signup ↔ onboarding merge, Phase 1.
  //
  // Unified signup wizard endpoints. Each step is a separate POST so the
  // wizard can persist incrementally and resume on browser-crash / device
  // switch. State is server-owned: the wizard reads `GET /auth/signup/state`
  // on every step entry. See `features/SIGNUP_MERGE_PLAN.md`.
  // ---------------------------------------------------------------------

  @Post('signup/begin')
  @UseGuards(RateLimitGuard)
  // Match the existing register limits (5/hour/IP) — this endpoint creates
  // accounts the same way `/auth/register` does. The orchestrator's
  // idempotent-resume contract means a legitimate user mashing the button
  // gets the same in-progress state, not five accounts.
  @RateLimit({ ttl: 3600, limit: 5, keyGenerator: (req) => `signup-begin:${req.ip}` })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Step 1 of the signup wizard: create a partial account, send verification email, and return tokens + state.',
    description:
      'Idempotent: re-submitting for an in-progress email returns the same account state. Re-submitting for a completed account returns 409 with code ACCOUNT_EXISTS.',
  })
  @ApiBody({ type: BeginSignupDto })
  @ApiResponse({ status: 201, description: 'Signup started' })
  @ApiResponse({ status: 409, description: 'Account already exists (code: ACCOUNT_EXISTS)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async beginSignup(@Body() dto: BeginSignupDto) {
    await this.humanVerification.assertVerified({
      token: dto.turnstileToken,
      honeypot: dto.website,
      action: 'signup_begin',
    });
    return this.authService.beginSignup(dto);
  }

  @Get('signup/state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Read the current signup-wizard state for the authenticated user.',
    description:
      'Source of truth for the wizard. Returns the role-required step list, the next step, completed steps, and any pre-filled data for resume.',
  })
  @ApiResponse({ status: 200, description: 'Signup state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSignupState(@CurrentUser() user: CurrentUserData) {
    return this.authService.getSignupState(user.userId);
  }

  @Post('signup/step/select-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wizard step: select role (customer or welper). Locked once written.' })
  @ApiBody({ type: SelectRoleStepDto })
  async submitSelectRoleStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SelectRoleStepDto,
  ) {
    return this.authService.submitSelectRoleStep(user.userId, dto);
  }

  @Post('signup/step/identity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wizard step: identity (name, phone, DOB, ToS + Privacy acceptance).' })
  @ApiBody({ type: IdentityStepDto })
  async submitIdentityStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: IdentityStepDto,
  ) {
    return this.authService.submitIdentityStep(user.userId, dto);
  }

  @Post('signup/step/welper-bio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wizard step (welper-only): bio.' })
  @ApiBody({ type: WelperBioStepDto })
  async submitWelperBioStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WelperBioStepDto,
  ) {
    return this.authService.submitWelperBioStep(user.userId, dto);
  }

  @Post('signup/step/welper-service-area')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wizard step (welper-only): service area (city, province, country, postal codes).' })
  @ApiBody({ type: WelperServiceAreaStepDto })
  async submitWelperServiceAreaStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WelperServiceAreaStepDto,
  ) {
    return this.authService.submitWelperServiceAreaStep(user.userId, dto);
  }

  @Post('signup/step/welper-offering')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wizard step (welper-only): first service offering.' })
  @ApiBody({ type: WelperOfferingStepDto })
  async submitWelperOfferingStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WelperOfferingStepDto,
  ) {
    return this.authService.submitWelperOfferingStep(user.userId, dto);
  }

  @Post('signup/step/welper-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Wizard step (welper-only): weekly availability slots, OR explicit ad-hoc-only toggle.',
  })
  @ApiBody({ type: WelperAvailabilityStepDto })
  async submitWelperAvailabilityStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WelperAvailabilityStepDto,
  ) {
    return this.authService.submitWelperAvailabilityStep(user.userId, dto);
  }

  @Post('signup/step/welper-background-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Wizard step (welper-only): acknowledge background check after payment and Certn invite.',
  })
  async submitWelperBackgroundCheckStep(@CurrentUser() user: CurrentUserData) {
    return this.authService.submitWelperBackgroundCheckStep(user.userId);
  }

  @Post('signup/step/welper-payout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Wizard step (welper-only): complete Stripe Connect Express onboarding (required).',
  })
  @ApiBody({ type: WelperPayoutStepDto })
  async submitWelperPayoutStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WelperPayoutStepDto,
  ) {
    return this.authService.submitWelperPayoutStep(user.userId, dto);
  }

  @Post('signup/step/notification-prefs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Wizard step (both roles): notification preferences. Defaults pre-applied; empty list keeps defaults.',
  })
  @ApiBody({ type: NotificationPrefsStepDto })
  async submitNotificationPrefsStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: NotificationPrefsStepDto,
  ) {
    return this.authService.submitNotificationPrefsStep(user.userId, dto);
  }

  @Post('signup/step/optional-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Wizard step (both roles): optional profile photo and address. Both fields optional.',
  })
  @ApiBody({ type: OptionalProfileStepDto })
  async submitOptionalProfileStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: OptionalProfileStepDto,
  ) {
    return this.authService.submitOptionalProfileStep(user.userId, dto);
  }

  @Post('signup/finish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Finalize signup: validates every role-required field is present and flips signupCompleted to true. Returns 422 with structured missingFields list otherwise.',
  })
  @ApiResponse({ status: 200, description: 'Signup completed' })
  @ApiResponse({
    status: 422,
    description: 'Some required steps are not yet complete (code: INCOMPLETE_SIGNUP)',
  })
  async finishSignup(@CurrentUser() user: CurrentUserData) {
    return this.authService.finishSignup(user.userId);
  }
}
