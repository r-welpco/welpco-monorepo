import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

@ApiSchema({ name: 'DomainAuthChangePasswordDto' })
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

