import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceAreaInfo } from '../../../common/types';
import { WeeklyAvailabilitySummaryDto } from '../../profile-management/availability/dto/weekly-availability-summary.dto';
import { PublicPortfolioPhotoDto } from '../../profile-management/sharing/dto';

export class PublicServiceOfferingDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  serviceCategoryId!: string;

  @ApiPropertyOptional({ type: [String], description: 'Selected subcategory IDs for this offering' })
  subcategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Selected subcategories for this offering' })
  subcategories?: Array<{ id: string; name: string }>;

  @ApiProperty({ description: 'Category display name (subcategory)' })
  categoryName!: string;

  @ApiPropertyOptional({ description: 'Parent (level-1) category name' })
  parentCategoryName?: string;

  @ApiProperty()
  serviceDescription!: string;

  @ApiProperty()
  hourlyRate!: number;

  @ApiProperty()
  experienceYears!: number;
}

export class PublicWelperProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  welperId!: string;

  @ApiPropertyOptional()
  firstName!: string | null;

  @ApiPropertyOptional({
    description:
      'Always null on public customer-facing responses. Use displayName instead.',
    nullable: true,
  })
  lastName!: string | null;

  @ApiProperty({
    description: 'Privacy-safe display name (first name + last initial).',
  })
  displayName!: string;

  @ApiPropertyOptional()
  bio!: string | null;

  @ApiPropertyOptional()
  profilePhotoUrl!: string | null;

  @ApiPropertyOptional({
    description:
      'Legacy GeoJSON / dashboard service-area JSON. Kept for backward compatibility ' +
      'with older clients; new code should consume `serviceAreaInfo` instead.',
  })
  serviceArea!: unknown;

  @ApiPropertyOptional({
    description:
      'Structured service-area shape — { city, province, country, postalCodes }. ' +
      'Null when the welper has not supplied a location yet.',
    nullable: true,
  })
  serviceAreaInfo!: ServiceAreaInfo | null;

  @ApiProperty({
    description:
      'Background-check trust signal. True only when background_check_status is Passed. ' +
      'Bible §22.6 forbids defaulting to true.',
  })
  verified!: boolean;

  @ApiProperty({
    description:
      'Minor welper flag (14–17). True only when date of birth is present and the welper is under 18.',
  })
  isMinor!: boolean;

  @ApiProperty({
    description:
      'Average review rating (2-decimal precision). Null when the welper has zero reviews — ' +
      'bible §22.6 forbids fake social proof.',
    nullable: true,
    example: 4.92,
  })
  averageRating!: number | null;

  @ApiProperty({ description: 'Number of completed reviews received.', example: 12 })
  reviewCount!: number;

  @ApiProperty({
    description: 'Number of jobs completed by the Welper.',
    example: 24,
  })
  completedBookingsCount!: number;

  @ApiProperty({
    description:
      'Median accept-latency in integer minutes over accepted bookings in the last 90 days. ' +
      'Null when fewer than 5 accepted bookings — bible §22.6 forbids inflated SLA signals.',
    nullable: true,
    example: 23,
  })
  responseTimeMinutes!: number | null;

  @ApiProperty({ type: [PublicServiceOfferingDto], description: 'Active service offerings' })
  serviceOfferings!: PublicServiceOfferingDto[];

  @ApiProperty({ type: WeeklyAvailabilitySummaryDto })
  weeklyAvailability!: WeeklyAvailabilitySummaryDto;

  @ApiPropertyOptional({
    description:
      'SHARE-002: vanity handle (`welpco.com/w/{handle}`). Null until the welper claims one.',
    nullable: true,
    example: 'marie-m',
  })
  handle!: string | null;

  @ApiProperty({
    type: [PublicPortfolioPhotoDto],
    description:
      'SHARE-001: approved portfolio photos only, ordered by the welper’s sortOrder, capped at 24. Empty when none are approved yet.',
  })
  portfolioPhotos!: PublicPortfolioPhotoDto[];
}
