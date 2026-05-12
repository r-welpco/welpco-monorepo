import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewerType } from '../entities/reviewer-type.enum';

export class ReviewResponseDto {
  @ApiProperty({ description: 'Review ID' })
  id!: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId!: string;

  @ApiProperty({ description: 'Reviewer user ID' })
  reviewerId!: string;

  @ApiProperty({ description: 'Reviewee user ID' })
  revieweeId!: string;

  @ApiProperty({ description: 'Who wrote the review', enum: ReviewerType })
  reviewerType!: ReviewerType;

  @ApiProperty({ description: 'Star rating 1-5' })
  rating!: number;

  @ApiPropertyOptional({ description: 'Optional comment' })
  comment?: string | null;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  createdAt!: string;
}
