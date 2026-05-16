import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

@ApiSchema({ name: 'DomainAuthRequestResetPasswordDto' })
export class RequestResetPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Locale of the reset form (updates preference when known user)',
    required: false,
    enum: ['en', 'fr'],
  })
  @IsOptional()
  @IsIn(['en', 'fr'])
  preferredLocale?: 'en' | 'fr';
}

@ApiSchema({ name: 'DomainAuthConfirmResetPasswordDto' })
export class ConfirmResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'reset-token-123',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}

