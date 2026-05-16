import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';
import { USER_PREFERRED_LOCALES } from '../../../../common/preferred-locale';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Preferred language for emails (en or fr)',
    required: false,
    enum: USER_PREFERRED_LOCALES,
  })
  @IsOptional()
  @IsIn(USER_PREFERRED_LOCALES)
  preferredLocale?: 'en' | 'fr';
}

