import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PreferredLocaleOptionalDto } from './preferred-locale.dto';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Step 1 of the unified signup wizard. Creates a `user_accounts` row with
 * `signup_completed = false` and dispatches a verification email asynchronously
 * (Wave 2 fire-and-forget pattern). Idempotent: a re-submit for an email that
 * already has `signup_completed = false` returns the existing account state
 * (the wizard reads `GET /auth/signup/state` and resumes). A re-submit for an
 * email that already has `signup_completed = true` returns 409 with code
 * `ACCOUNT_EXISTS` (the user should sign in, not start over).
 */
export class BeginSignupDto extends PreferredLocaleOptionalDto {
  @ApiProperty({
    description: 'User email address (lowercased and trimmed server-side).',
    example: 'jordan@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'User password. Bounds match the existing register policy.',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128, { message: 'password must be at most 128 characters' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
