import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'Welper ID to add as favorite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  welperId: string;

  @ApiProperty({
    description: 'Notes about this favorite',
    example: 'Great service, very reliable',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

