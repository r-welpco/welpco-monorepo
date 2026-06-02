import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Privacy-safe customer snapshot for welpers (booking list, marketplace). */
export class CustomerPublicSummaryDto {
  @ApiProperty()
  customerId!: string;

  @ApiProperty({ description: 'First name + last initial (e.g. "Alex R.")' })
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  photoUrl!: string | null;

  @ApiProperty({
    description:
      'Average rating from welper-authored reviews. Null when reviewCount === 0.',
    nullable: true,
    example: 4.75,
  })
  averageRating!: number | null;

  @ApiProperty({ description: 'Number of welper-authored reviews received.' })
  reviewCount!: number;

  @ApiProperty({
    description: 'Completed bookings on the platform (completed + payment released).',
  })
  completedBookingsCount!: number;

  @ApiProperty({ description: 'Job posts published by this customer (any status).' })
  jobPostingsCount!: number;

  @ApiProperty({ description: 'Account creation date (ISO 8601).' })
  memberSince!: string;

  @ApiProperty({
    description: 'True when profile completion status is Complete (incl. default payment).',
  })
  profileComplete!: boolean;
}
