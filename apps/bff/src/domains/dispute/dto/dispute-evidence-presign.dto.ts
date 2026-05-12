import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DISPUTES-001 (Day 16): the BFF mints presigned PUT URLs so the FE can upload
 * dispute evidence directly to S3 without proxying bytes through the BFF
 * (matches the existing profile-photo upload pattern in `uploads.service.ts`).
 *
 * Validation contract (mirrors the FE `<EvidenceUpload>` guards):
 *  - `contentType` is whitelist-only — image/jpeg, image/png, image/webp,
 *    image/heic, application/pdf. Anything else is a 400.
 *  - `sizeBytes` capped at 10 MB. The BFF cannot enforce the size of the
 *    eventual upload (S3 presigned PUTs are content-length-agnostic by
 *    default), but it can refuse to mint a URL for an obviously-bogus
 *    request.
 *  - `fileName` is purely a hint for the S3 key suffix — sanitised before
 *    use; rejected if absurdly long.
 */
export const DISPUTE_EVIDENCE_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;

/** 10 MB cap, matches FE `EvidenceUpload` `maxSizeMB` default. */
export const DISPUTE_EVIDENCE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export type DisputeEvidenceContentType =
  (typeof DISPUTE_EVIDENCE_ALLOWED_CONTENT_TYPES)[number];

export class DisputeEvidencePresignRequestDto {
  @ApiProperty({
    description: 'Original file name (used for the S3 key suffix only)',
    example: 'receipt.pdf',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    description: 'MIME content type — whitelist-enforced',
    enum: DISPUTE_EVIDENCE_ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(DISPUTE_EVIDENCE_ALLOWED_CONTENT_TYPES)
  contentType!: DisputeEvidenceContentType;

  @ApiProperty({
    description: 'Declared file size in bytes (capped at 10 MB)',
    example: 524288,
    minimum: 1,
    maximum: DISPUTE_EVIDENCE_MAX_SIZE_BYTES,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(DISPUTE_EVIDENCE_MAX_SIZE_BYTES)
  sizeBytes?: number;
}

export class DisputeEvidencePresignResponseDto {
  @ApiProperty({
    description: 'Short-lived (15 min) presigned S3 PUT URL',
    example: 'https://bucket.s3.amazonaws.com/disputes/...?X-Amz-...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'S3 object key — the FE submits this as `evidence[].key`',
    example: 'disputes/abc123/uuid.pdf',
  })
  key!: string;

  @ApiProperty({
    description: 'Required `Content-Type` request header for the PUT call',
    example: 'image/jpeg',
  })
  contentType!: DisputeEvidenceContentType;

  @ApiProperty({
    description: 'TTL of the presigned URL in seconds',
    example: 900,
  })
  ttlSeconds!: number;
}
