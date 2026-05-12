import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'refresh-token-123',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

