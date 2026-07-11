import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * SHARE-005: share-channel source codes. Anything outside the whitelist is
 * normalized to `unknown` at write time (never rejected — the view ping is
 * fire-and-forget and must not error for stale clients).
 */
export const PROFILE_VIEW_SOURCES = [
  'link',
  'qr',
  'story',
  'square',
  'og',
  // QR codes embedded in the downloadable share cards (scans ≠ typed visits).
  'qr-story',
  'qr-square',
  'qr-landscape',
  'direct',
  'unknown',
] as const;

export type ProfileViewSource = (typeof PROFILE_VIEW_SOURCES)[number];

export class RecordProfileViewDto {
  @ApiPropertyOptional({
    description: `Share channel that brought the visit. Whitelist: ${PROFILE_VIEW_SOURCES.join(', ')} — anything else counts as "unknown".`,
    example: 'qr',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  src?: string;
}

export class ProfileViewSourceTotalDto {
  @ApiProperty({ example: 'qr' })
  src!: string;

  @ApiProperty({ example: 12 })
  count!: number;
}

export class ProfileViewStatsResponseDto {
  @ApiProperty({ description: 'All-time total across every source', example: 87 })
  total!: number;

  @ApiProperty({ description: 'Total across every source in the last 30 days', example: 34 })
  last30DaysTotal!: number;

  @ApiProperty({ type: [ProfileViewSourceTotalDto], description: 'All-time totals per source, descending' })
  totalsBySrc!: ProfileViewSourceTotalDto[];
}
