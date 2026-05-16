import { ApiProperty } from '@nestjs/swagger';
import { AccountType, AccountStatus } from '../../entities/user-account.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    accountType: AccountType;
    status: AccountStatus;
    emailVerified: boolean;
    /** Unified signup wizard finished (replaces legacy-only onboarding gate). */
    signupCompleted?: boolean;
    /** When PLATFORM_ACCESS_GATED is on, clients should treat dashboard as unavailable. */
    platformAccessEnabled?: boolean;
    /** Set by BFF from profile; required for dashboard/settings access. */
    onboardingCompleted?: boolean;
    /** Customer profile completion (includes payment method when applicable). */
    profileCompletionStatus?: string;
  };
}

