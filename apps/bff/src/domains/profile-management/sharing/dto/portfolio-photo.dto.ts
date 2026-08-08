import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PortfolioPhotoStatus } from '../../entities/portfolio-photo-status.enum';
import { PORTFOLIO_MAX_PHOTOS } from './portfolio-presign.dto';
import { IsMarketplaceDescriptionAllowed } from '../../../../common/validators/marketplace-description.validator';

export class CreatePortfolioPhotoDto {
  @ApiProperty({
    description:
      'S3 key returned by the presign endpoint. Must live in the caller’s namespace (`portfolio/{welperId}/…`).',
    example: 'portfolio/6f9619ff-8b86-d011-b42d-00c04fc964ff/uuid.jpg',
    maxLength: 512,
  })
  @IsString()
  @MaxLength(512)
  s3Key!: string;

  @ApiPropertyOptional({ description: 'Caption shown under the photo', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @IsMarketplaceDescriptionAllowed()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Optional album link to one of the welper’s own service offerings',
  })
  @IsOptional()
  @IsUUID()
  offeringId?: string;
}

export class UpdatePortfolioPhotoDto {
  @ApiPropertyOptional({ description: 'New caption (null-out by sending an empty string)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @IsMarketplaceDescriptionAllowed()
  caption?: string;

  @ApiPropertyOptional({ description: 'New sort position (0-based)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderPortfolioDto {
  @ApiProperty({
    description:
      'Photo ids in the desired display order. Every id must belong to the caller; ids not listed keep their relative order after the listed ones.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(PORTFOLIO_MAX_PHOTOS)
  @IsUUID('all', { each: true })
  photoIds!: string[];
}

export class PortfolioPhotoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  welperId!: string;

  @ApiPropertyOptional({ nullable: true })
  offeringId!: string | null;

  @ApiProperty({ description: 'S3 object key (owner + admin views only)' })
  s3Key!: string;

  @ApiPropertyOptional({
    description: 'Resolved display URL (same public-bucket resolution as profilePhotoUrl); null when storage is unconfigured',
    nullable: true,
  })
  url!: string | null;

  @ApiPropertyOptional({ nullable: true })
  caption!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ enum: PortfolioPhotoStatus })
  status!: PortfolioPhotoStatus;

  @ApiPropertyOptional({ description: 'Set when status=rejected', nullable: true })
  rejectionReason!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

/** Public (customer-facing) shape — approved photos only, no moderation fields. */
export class PublicPortfolioPhotoDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  url!: string | null;

  @ApiPropertyOptional({ nullable: true })
  caption!: string | null;

  @ApiPropertyOptional({ nullable: true })
  offeringId!: string | null;
}
