import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileCompletionStatus } from '../../entities/profile-completion-status.enum';
import { ProfileVisibility } from '../../entities/profile-visibility.enum';
import { ServiceAreaInfo } from '../../../../common/types';

export class WelperProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  id: string;

  @ApiProperty({ description: 'Welper ID' })
  welperId: string;

  @ApiProperty({ description: 'Bio/description', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Profile photo URL', nullable: true })
  profilePhotoUrl: string | null;

  @ApiProperty({
    description:
      'Service area (legacy GeoJSON Point/Polygon or dashboard radius shape; kept for radius search compatibility).',
    nullable: true,
  })
  serviceArea: any | null;

  @ApiPropertyOptional({
    description:
      'Wave 1 structured service-area shape consumed by the public welper hero. ' +
      'Null until the welper supplies city/province/country.',
    nullable: true,
  })
  serviceAreaInfo: ServiceAreaInfo | null;

  @ApiProperty({
    description: 'KYC-verified flag. False by default; only flipped after identity check.',
  })
  verified: boolean;

  @ApiProperty({
    description:
      'Average review rating (2-decimal precision). Null when the welper has zero reviews.',
    nullable: true,
    example: 4.92,
  })
  averageRating: number | null;

  @ApiProperty({ description: 'Number of reviews received.', example: 12 })
  reviewCount: number;

  @ApiProperty({
    description:
      'Median accept-latency in minutes over the welper\'s last 90 days of accepted bookings. ' +
      'Null when fewer than 5 accepted bookings — bible §22.6 forbids inflated SLA signals.',
    nullable: true,
    example: 23,
  })
  responseTimeMinutes: number | null;

  @ApiProperty({
    description: 'Profile completion status',
    enum: ProfileCompletionStatus,
  })
  profileCompletionStatus: ProfileCompletionStatus;

  @ApiProperty({
    description: 'Profile visibility',
    enum: ProfileVisibility,
  })
  profileVisibility: ProfileVisibility;

  @ApiProperty({ description: 'Onboarding completed' })
  onboardingCompleted: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
