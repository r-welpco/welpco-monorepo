import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlRequestDto {
  @ApiProperty({ example: 'profile-photo.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg', enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}
