import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationCategory } from '../../../domains/notification/entities/notification-category.enum';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Both-roles final-ish step. Same shape as the existing
 * `NotificationPreferences` writes — category × emailEnabled / inAppEnabled
 * pairs. Defaults are pre-applied server-side (all categories opt-in by
 * default per the existing `notification_preferences` table defaults). A
 * user submitting an empty array is fine — the orchestrator just keeps the
 * defaults.
 *
 * Both fields default to `true` per existing entity, matching bible §22.6
 * "opt-out, not opt-in" for transactional notifications.
 */
export class NotificationPreferenceItemDto {
  @ApiProperty({
    description: 'Notification category.',
    enum: NotificationCategory,
    example: NotificationCategory.BOOKING,
  })
  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @ApiProperty({ description: 'Email channel toggle.', example: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'In-app channel toggle.', example: true })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;
}

export class NotificationPrefsStepDto {
  @ApiProperty({
    description:
      'Per-category overrides. Categories not listed keep the server defaults ' +
      '(all opt-in). An empty list is acceptable and means "use defaults".',
    type: [NotificationPreferenceItemDto],
  })
  @IsArray()
  @ArrayMaxSize(20, { message: 'too many preference entries' })
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  preferences!: NotificationPreferenceItemDto[];
}
