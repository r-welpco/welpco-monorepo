import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

/**
 * SHARE-001: presigned PUT minting for portfolio photos. Mirrors the
 * dispute-evidence presign contract (`dispute-evidence-presign.dto.ts`):
 * whitelist-only content type, 10 MB declared-size cap, per-welper S3
 * namespace, 15-min TTL. Images only — no PDF here, this is a photo gallery.
 *
 * EXIF/GPS stripping is a documented client-side responsibility at MVP
 * (canvas re-encode before upload); server-side processing is future work.
 */
export const PORTFOLIO_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

/** 10 MB cap — matches the dispute-evidence presign cap. */
export const PORTFOLIO_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Hard cap on photos per welper (SHARE-001 acceptance criteria). */
export const PORTFOLIO_MAX_PHOTOS = 24;

export type PortfolioContentType = (typeof PORTFOLIO_ALLOWED_CONTENT_TYPES)[number];

export class PortfolioPresignRequestDto {
  @ApiProperty({
    description: 'MIME content type — whitelist-enforced (images only)',
    enum: PORTFOLIO_ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(PORTFOLIO_ALLOWED_CONTENT_TYPES)
  contentType!: PortfolioContentType;

  @ApiProperty({
    description: 'Declared file size in bytes (capped at 10 MB)',
    example: 524288,
    minimum: 1,
    maximum: PORTFOLIO_MAX_SIZE_BYTES,
  })
  @IsInt()
  @Min(1)
  @Max(PORTFOLIO_MAX_SIZE_BYTES)
  fileSize!: number;
}

export class PortfolioPresignResponseDto {
  @ApiProperty({
    description: 'Short-lived (15 min) presigned S3 PUT URL',
    example: 'https://bucket.s3.amazonaws.com/portfolio/...?X-Amz-...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description:
      'S3 object key — submit this as `s3Key` on POST /profiles/me/portfolio after the PUT succeeds',
    example: 'portfolio/6f9619ff-8b86-d011-b42d-00c04fc964ff/uuid.jpg',
  })
  key!: string;

  @ApiProperty({
    description: 'Required `Content-Type` request header for the PUT call',
    example: 'image/jpeg',
  })
  contentType!: PortfolioContentType;

  @ApiProperty({ description: 'TTL of the presigned URL in seconds', example: 900 })
  ttlSeconds!: number;
}
