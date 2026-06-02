import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobApplicationStatus, JobPostingStatus } from '../entities';

export class JobPostingListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  subcategoryId!: string;

  @ApiPropertyOptional()
  categoryLabel?: string | null;

  @ApiPropertyOptional()
  subcategoryLabel?: string | null;

  @ApiProperty()
  scheduledDate!: string;

  @ApiProperty()
  scheduledStartTime!: string;

  @ApiProperty()
  scheduledEndTime!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiPropertyOptional()
  locationCity?: string | null;

  @ApiPropertyOptional()
  locationRegion?: string | null;

  @ApiProperty({ enum: JobPostingStatus })
  status!: JobPostingStatus;

  @ApiProperty()
  applicationCount!: number;

  @ApiProperty()
  publishedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  canApply?: boolean;

  @ApiPropertyOptional()
  applyBlockReason?: string | null;

  @ApiPropertyOptional()
  myApplicationId?: string | null;

  @ApiPropertyOptional()
  customerDisplayName?: string | null;

  @ApiPropertyOptional()
  customerPhotoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Customer user ID — included for welper marketplace list views.',
  })
  customerId?: string;
}

export class JobPostingResponseDto extends JobPostingListItemDto {
  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  locationAddress?: string | null;

  @ApiProperty()
  answers!: Record<string, string | number | boolean>;

  @ApiProperty()
  serviceQuestionCategoryId!: string;

  @ApiPropertyOptional()
  bookingId?: string | null;

  @ApiProperty()
  expiresAt!: string;

  @ApiPropertyOptional()
  matchingOfferings?: Array<{ id: string; hourlyRate: number; serviceDescription: string }>;

  @ApiPropertyOptional({ type: () => JobApplicationResponseDto })
  myApplication?: JobApplicationResponseDto | null;
}

export class JobApplicationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  jobPostingId!: string;

  @ApiProperty()
  welperId!: string;

  @ApiProperty()
  offeringId!: string;

  @ApiProperty()
  proposalMessage!: string;

  @ApiProperty({ enum: JobApplicationStatus })
  status!: JobApplicationStatus;

  @ApiPropertyOptional()
  hourlyRateSnapshot?: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  welperDisplayName?: string | null;

  @ApiPropertyOptional()
  welperRating?: number | null;

  @ApiPropertyOptional()
  welperVerified?: boolean;
}

export class BookingHandoffContextDto {
  @ApiProperty()
  jobPostingId!: string;

  @ApiProperty()
  jobApplicationId!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  welperId!: string;

  @ApiProperty()
  offeringId!: string;

  @ApiProperty()
  serviceQuestionCategoryId!: string;

  @ApiProperty()
  answers!: Record<string, string | number | boolean>;

  @ApiProperty()
  scheduledDate!: string;

  @ApiProperty()
  scheduledStartTime!: string;

  @ApiProperty()
  scheduledEndTime!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiPropertyOptional()
  locationAddress?: string | null;

  @ApiPropertyOptional()
  locationCity?: string | null;

  @ApiPropertyOptional()
  locationRegion?: string | null;

  @ApiPropertyOptional()
  hourlyRate?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class PaginatedJobPostingsDto {
  @ApiProperty({ type: [JobPostingListItemDto] })
  data!: JobPostingListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedJobApplicationsDto {
  @ApiProperty({ type: [JobApplicationResponseDto] })
  data!: JobApplicationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
