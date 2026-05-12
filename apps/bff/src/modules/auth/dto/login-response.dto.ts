import { ApiProperty } from '@nestjs/swagger';
import { AccountType, AccountStatus } from '../../../domains/user-management/entities/user-account.entity';

/**
 * BFF login response: user (account only) + profile from profile domain.
 * Onboarding and other profile fields live under .profile, not on user.
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User account information (no profile data)' })
  user: {
    id: string;
    email: string;
    accountType: AccountType;
    status: AccountStatus;
    emailVerified: boolean;
  };

  @ApiProperty({
    description: 'Profile-domain data (e.g. onboarding status)',
    example: { onboardingCompleted: true },
  })
  profile: {
    onboardingCompleted: boolean;
  };
}
