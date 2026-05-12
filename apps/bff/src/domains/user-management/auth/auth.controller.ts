import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
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
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  RequestResetPasswordDto,
  ConfirmResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './dto';
import { Public, CurrentUser, JwtAuthGuard } from '../../../common/auth';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RateLimitGuard } from './guards/rate-limit.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 3600, limit: 5, keyGenerator: (req) => `register:${req.ip}` })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 900, limit: 5, keyGenerator: (req) => `login:${req.body?.email || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('verify-email')
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 900, limit: 5, keyGenerator: (req) => `verify-email:${req.body?.token || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
  })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerificationEmail(
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    return this.authService.resendVerificationEmail(user.userId);
  }

  @Public()
  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 3600, limit: 3, keyGenerator: (req) => `password-reset:${req.body?.email || req.ip}` })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Wave 2 (BFF): always returns `{ ok: true }` regardless of whether the email is known. Bible §22.6 enumeration-safe contract — known and unknown emails are indistinguishable from the response shape and from response timing (email send is dispatched fire-and-forget out-of-band).',
  })
  @ApiBody({ type: RequestResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Always 200 with `{ ok: true }` (whether or not the email exists)',
    schema: { type: 'object', properties: { ok: { type: 'boolean', example: true } } },
  })
  async requestResetPassword(
    @Body() requestResetDto: RequestResetPasswordDto,
  ): Promise<{ ok: true }> {
    await this.authService.requestResetPassword(requestResetDto);
    return { ok: true };
  }

  @Public()
  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiBody({ type: ConfirmResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({ status: 400, description: 'Invalid reset token' })
  async confirmResetPassword(
    @Body() confirmResetDto: ConfirmResetPasswordDto,
  ): Promise<void> {
    return this.authService.confirmResetPassword(confirmResetDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully rotated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session information' })
  @ApiResponse({
    status: 200,
    description: 'Session information',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            accountType: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSession(
    @CurrentUser() user: {
      userId: string;
      email: string;
      accountType: string;
    },
  ) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session (no-op, client handles via NextAuth)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(): Promise<void> {
    // No-op: JWT-based auth doesn't require server-side session invalidation
    // Client handles logout via NextAuth signOut()
  }
}

