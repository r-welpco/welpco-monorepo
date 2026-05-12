import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const CATEGORIES = ['no_show', 'quality', 'overcharge', 'safety', 'other'] as const;

/**
 * DISPUTES-001 (Day 16): a single evidence reference. The BFF accepts these
 * post-upload — the FE has already PUT the bytes to S3 via the presign
 * endpoint and now references the resulting `key`. `signedUrl` is generated
 * on read (see `DisputeService.signEvidence`), never on write.
 */
export class CreateDisputeEvidenceItemDto {
  @ApiProperty({ enum: ['file', 'message'], description: 'Evidence kind' })
  @IsString()
  @IsIn(['file', 'message'])
  type!: 'file' | 'message';

  @ApiPropertyOptional({
    description:
      'S3 object key (for `type: "file"`). Format: `disputes/<userId>/<uuid>.<ext>`. Max 512 chars.',
    example: 'disputes/abc123/uuid.pdf',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  key?: string;

  @ApiPropertyOptional({
    description: 'Message id (for `type: "message"`).',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ description: 'Short subject', minLength: 5, maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ description: 'Dispute category', enum: CATEGORIES })
  @IsString()
  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /**
   * DISPUTES-001 (Day 16): up to 5 references — matches the FE
   * `EvidenceUpload` `maxFiles` default. Bigger arrays get a 400, not a
   * silent truncation, so the user knows the report is incomplete.
   */
  @ApiPropertyOptional({
    description: 'Evidence references (S3 keys + message ids, max 5 items)',
    type: [CreateDisputeEvidenceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateDisputeEvidenceItemDto)
  evidence?: CreateDisputeEvidenceItemDto[];
}
