import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ description: 'Favorite ID' })
  id: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Welper ID' })
  welperId: string;

  @ApiProperty({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

