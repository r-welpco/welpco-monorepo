import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

@ApiSchema({ name: 'DomainAuthVerifyEmailDto' })
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'verification-token-123',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

