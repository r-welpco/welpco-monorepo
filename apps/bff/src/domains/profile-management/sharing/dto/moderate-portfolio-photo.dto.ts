import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PortfolioPhotoStatus } from '../../entities/portfolio-photo-status.enum';

/** Admin moderation decision — only approved/rejected are reachable via the API. */
export const MODERATION_TARGET_STATUSES = [
  PortfolioPhotoStatus.APPROVED,
  PortfolioPhotoStatus.REJECTED,
] as const;

export class ModeratePortfolioPhotoDto {
  @ApiProperty({
    description: 'Moderation outcome',
    enum: MODERATION_TARGET_STATUSES,
    example: PortfolioPhotoStatus.APPROVED,
  })
  @IsIn(MODERATION_TARGET_STATUSES)
  status!: (typeof MODERATION_TARGET_STATUSES)[number];

  @ApiPropertyOptional({
    description: 'Shown to the welper when rejecting (recommended for every rejection)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
