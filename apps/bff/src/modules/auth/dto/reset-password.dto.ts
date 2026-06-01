import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { PreferredLocaleOptionalDto } from './preferred-locale.dto';
import { IsStrongPassword } from '../../../domains/user-management/auth/validators/password.validator';

@ApiSchema({ name: 'BffAuthRequestResetPasswordDto' })
export class RequestResetPasswordDto extends PreferredLocaleOptionalDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

@ApiSchema({ name: 'BffAuthConfirmResetPasswordDto' })
export class ConfirmResetPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456',
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

@ApiSchema({ name: 'BffAuthChangePasswordDto' })
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
