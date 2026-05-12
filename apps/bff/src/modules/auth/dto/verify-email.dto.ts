import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

@ApiSchema({ name: 'BffAuthVerifyEmailDto' })
export class VerifyEmailDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123def456',
  })
  @IsString()
  token: string;
}
