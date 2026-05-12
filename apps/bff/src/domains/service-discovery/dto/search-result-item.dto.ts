import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultItemDto {
  @ApiProperty({ description: 'Welper user/profile ID' })
  welperId!: string;

  @ApiProperty({ description: 'Display name (first + last)' })
  name!: string;

  @ApiProperty({ description: 'Short title (e.g. first category or "Welper")' })
  title!: string;

  @ApiProperty({ description: 'Location/service area summary (e.g. "Ontario, Canada")' })
  location!: string;

  @ApiProperty({ description: 'Minimum hourly rate across active offerings' })
  hourlyRate!: number;

  @ApiProperty({ description: 'Category names for display' })
  categories!: string[];

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  profilePhotoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Bio snippet' })
  bioSnippet?: string | null;

  @ApiPropertyOptional({ description: 'Average rating (0 if no reviews)' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Review count' })
  reviewCount?: number;
}

export class SearchServicesResponseDto {
  @ApiProperty({ type: [SearchResultItemDto] })
  items!: SearchResultItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
